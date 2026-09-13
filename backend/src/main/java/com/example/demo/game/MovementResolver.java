package com.example.demo.game;

import com.example.demo.model.CardType;

import java.util.List;
import java.util.Map;

/**
 * Resolves one activation phase: given every robot's five programmed
 * registers, applies them register-by-register (all robots' register 1,
 * then all register 2, and so on)
 *
 * Simplifications for version 0:
 *  - Within a single register, robots are processed in the iteration order
 *    of the map the caller provides.
 *    if/when collision handling needs a real tie-break order.
 *  - No collision detection or pushing between robots.
 */
public class MovementResolver {

    private static final int REGISTER_COUNT = 5;

    public void resolveRound(GameBoard board, Map<Robot, List<CardType>> programmedRegisters) {
        for (int registerIndex = 0; registerIndex < REGISTER_COUNT; registerIndex++) {
            for (Map.Entry<Robot, List<CardType>> entry : programmedRegisters.entrySet()) {
                List<CardType> registers = entry.getValue();
                if (registerIndex < registers.size()) {
                    applyCard(board, entry.getKey(), registers.get(registerIndex));
                }
            }
        }
    }

    private void applyCard(GameBoard board, Robot robot, CardType card) {
        switch (card) {
            case MOVE_1 -> robot.moveForward(board, 1);
            case MOVE_2 -> robot.moveForward(board, 2);
            case MOVE_3 -> robot.moveForward(board, 3);
            case BACK_UP -> robot.moveBackward(board, 1);
            case TURN_LEFT -> robot.turnLeft();
            case TURN_RIGHT -> robot.turnRight();
            case U_TURN -> robot.uTurn();
            default -> {
                // POWER_UP, AGAIN, and damage cards don't move the robot directly.
            }
        }
    }
}
