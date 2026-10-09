package com.example.demo.game;

import com.example.demo.model.CardType;
import com.example.demo.model.Conveyor;
import com.example.demo.model.Direction;
import com.example.demo.model.Position;
import com.example.demo.model.PushPanel;
import com.example.demo.model.ResolutionPhase;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Resolves one activation phase register by register. Walls and the board edge
 * block everything that moves; cards push other robots, belts and panels don't.
 */
public class MovementResolver {

    private static final int REGISTER_COUNT = 5;

    @FunctionalInterface
    public interface RegisterCallback {
        /**
         * Called after every step of every register, in activation order.
         * cardsPlayed is only filled for the CARD phase (the card as programmed,
         * so AGAIN stays AGAIN).
         */
        void onPhaseResolved(int registerNumber, ResolutionPhase phase, Map<Robot, CardType> cardsPlayed);
    }

    public void resolveRound(GameBoard board, Map<Robot, List<CardType>> programmedRegisters,
                             RegisterCallback callback) {
        List<Robot> robots = List.copyOf(programmedRegisters.keySet());
        Map<Robot, CardType> lastEffective = new HashMap<>(); // for AGAIN

        for (int registerNumber = 1; registerNumber <= REGISTER_COUNT; registerNumber++) {
            // Activation order of one register:
            Map<Robot, CardType> played = doProgrammingCards(board, robots, programmedRegisters, registerNumber, lastEffective);
            notify(callback, registerNumber, ResolutionPhase.CARD, played);

            doBlueConveyors(board, robots);
            notify(callback, registerNumber, ResolutionPhase.EXPRESS_BELT, Map.of());

            doGreenConveyors(board, robots);
            notify(callback, registerNumber, ResolutionPhase.BELT, Map.of());

            doPushPanels(board, robots, registerNumber);
            notify(callback, registerNumber, ResolutionPhase.PUSH_PANEL, Map.of());

            // doGears(board, robots);          // TODO: gear activation
            // doBoardLasers(board, robots);    // TODO: board laser activation
            // doRobotLasers(board, robots);    // TODO: robot laser activation
            // doEnergySpaces(board, robots);   // TODO: energy space activation
            // doCheckpoints(board, robots);    // TODO: checkpoint activation
        }
    }

    private void notify(RegisterCallback callback, int register, ResolutionPhase phase, Map<Robot, CardType> cards) {
        if (callback != null) callback.onPhaseResolved(register, phase, cards);
    }

    // cards

    private Map<Robot, CardType> doProgrammingCards(GameBoard board, List<Robot> robots,
                                                    Map<Robot, List<CardType>> programmed,
                                                    int registerNumber, Map<Robot, CardType> lastEffective) {
        Map<Robot, CardType> played = new LinkedHashMap<>();
        for (Map.Entry<Robot, List<CardType>> entry : programmed.entrySet()) {
            List<CardType> registers = entry.getValue();
            if (registerNumber > registers.size()) continue;

            Robot robot = entry.getKey();
            CardType card = registers.get(registerNumber - 1);
            // AGAIN repeats the previous register; with nothing to repeat it does nothing.
            CardType effective = card == CardType.AGAIN ? lastEffective.get(robot) : card;
            if (effective != null) {
                applyCard(board, robots, robot, effective);
                lastEffective.put(robot, effective);
            }
            played.put(robot, card);
        }
        return played;
    }

    private void applyCard(GameBoard board, List<Robot> robots, Robot robot, CardType card) {
        switch (card) {
            case MOVE_1 -> moveRobot(board, robots, robot, robot.getDirection(), 1);
            case MOVE_2 -> moveRobot(board, robots, robot, robot.getDirection(), 2);
            case MOVE_3 -> moveRobot(board, robots, robot, robot.getDirection(), 3);
            case BACK_UP -> moveRobot(board, robots, robot, robot.getDirection().opposite(), 1);
            case TURN_LEFT -> robot.turnLeft();
            case TURN_RIGHT -> robot.turnRight();
            case U_TURN -> robot.uTurn();
            default -> {
                // POWER_UP and damage cards don't move the robot.
            }
        }
    }

    /** Moves one tile at a time; once blocked, the remaining spaces are lost. */
    private void moveRobot(GameBoard board, List<Robot> robots, Robot robot, Direction direction, int spaces) {
        for (int i = 0; i < spaces; i++) {
            if (!pushRobot(board, robots, robot, direction)) return;
        }
    }

    /**
     * Moves a robot one tile, pushing any robot in the way (which may push the
     * next one, and so on). If the robot, or anything it pushes, would hit a wall
     * or the board edge, nothing moves and false is returned.
     */
    private boolean pushRobot(GameBoard board, List<Robot> robots, Robot robot, Direction direction) {
        if (!board.canMove(robot.getPosition(), direction)) return false;

        Position target = robot.getPosition().moveIn(direction, 1);
        Robot blocker = robotAt(robots, target, robot);
        if (blocker != null && !pushRobot(board, robots, blocker, direction)) return false;

        robot.moveTo(target);
        return true;
    }

    private Robot robotAt(List<Robot> robots, Position position, Robot except) {
        for (Robot other : robots) {
            if (other != except && other.getPosition().equals(position)) return other;
        }
        return null;
    }

    // conveyors

    /** Step 1: blue (express) belts move robots one tile. */
    private void doBlueConveyors(GameBoard board, List<Robot> robots) {
        moveOnBelts(board, robots, true);
    }

    /**
     * Step 2: every belt, blue and green, moves robots one tile, as in the
     * official rules (so blue belts move a robot two tiles per register in total).
     */
    private void doGreenConveyors(GameBoard board, List<Robot> robots) {
        moveOnBelts(board, robots, false);
    }

    private void moveOnBelts(GameBoard board, List<Robot> robots, boolean expressOnly) {
        Map<Robot, Position> moves = new LinkedHashMap<>();
        Map<Robot, Direction> travel = new HashMap<>();
        for (Robot robot : robots) {
            Conveyor belt = board.conveyorAt(robot.getPosition());
            if (belt == null || (expressOnly && !belt.isExpress())) continue;
            if (!board.canMove(robot.getPosition(), belt.direction())) continue; // wall or edge
            moves.put(robot, robot.getPosition().moveIn(belt.direction(), 1));
            travel.put(robot, belt.direction());
        }
        for (Robot robot : applyMoves(robots, moves)) {
            // A robot carried onto a belt that bends is turned with it.
            Conveyor landed = board.conveyorAt(robot.getPosition());
            if (landed == null) continue;
            Direction moved = travel.get(robot);
            if (landed.direction() == moved.rotateRight()) robot.turnRight();
            else if (landed.direction() == moved.rotateLeft()) robot.turnLeft();
        }
    }

    // push panels

    private void doPushPanels(GameBoard board, List<Robot> robots, int registerNumber) {
        Map<Robot, Position> moves = new LinkedHashMap<>();
        for (Robot robot : robots) {
            PushPanel panel = board.pushPanelAt(robot.getPosition());
            if (panel == null || !panel.isActiveIn(registerNumber)) continue;
            if (!board.canMove(robot.getPosition(), panel.direction())) continue; // wall or edge
            moves.put(robot, robot.getPosition().moveIn(panel.direction(), 1));
        }
        applyMoves(robots, moves);
    }

    /**
     * Applies simultaneous one-tile moves (belts, panels). A move is cancelled
     * when two robots target the same tile, when the target holds a robot that is
     * not moving, or when two robots would swap places. Repeats until nothing
     * changes (cancelling one move can block another). Returns the robots that moved.
     */
    private List<Robot> applyMoves(List<Robot> robots, Map<Robot, Position> moves) {
        boolean changed = true;
        while (changed) {
            changed = false;

            Map<Position, List<Robot>> byTarget = new HashMap<>();
            moves.forEach((robot, target) -> byTarget.computeIfAbsent(target, k -> new ArrayList<>()).add(robot));
            for (List<Robot> group : byTarget.values()) {
                if (group.size() > 1) {
                    group.forEach(moves::remove);
                    changed = true;
                }
            }

            for (Robot robot : new ArrayList<>(moves.keySet())) {
                Position target = moves.get(robot);
                if (target == null) continue;
                Robot other = robotAt(robots, target, robot);
                if (other == null) continue;
                Position otherTarget = moves.get(other);
                if (otherTarget == null || otherTarget.equals(robot.getPosition())) {
                    moves.remove(robot);
                    changed = true;
                }
            }
        }
        List<Robot> moved = new ArrayList<>(moves.keySet());
        moves.forEach(Robot::moveTo);
        return moved;
    }
}
