package com.example.demo.game;

import com.example.demo.model.CardType;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Resolves one activation phase register-by-register (all robots' register 1,
 * then all register 2, ...).
 * Still simplified: robots are processed in the iteration order of the input map,
 * and there is no collision/pushing between robots yet.
 */
public class MovementResolver {

    private static final int REGISTER_COUNT = 5;

    @FunctionalInterface
    public interface RegisterCallback {
        /**
         * Called after all robots' cards for one register have been applied.
         * registerNumber is 1-based. cardsPlayed holds the card as programmed
         * (so AGAIN is reported as AGAIN) for robots that had a card this register.
         */
        void onRegisterResolved(int registerNumber, Map<Robot, CardType> cardsPlayed);
    }

    public void resolveRound(GameBoard board, Map<Robot, List<CardType>> programmedRegisters,
                             RegisterCallback callback) {
        // What each robot's previous register actually did, for AGAIN.
        Map<Robot, CardType> lastEffective = new HashMap<>();

        for (int registerIndex = 0; registerIndex < REGISTER_COUNT; registerIndex++) {
            Map<Robot, CardType> cardsThisRegister = new LinkedHashMap<>();
            for (Map.Entry<Robot, List<CardType>> entry : programmedRegisters.entrySet()) {
                List<CardType> registers = entry.getValue();
                if (registerIndex >= registers.size()) continue;

                Robot robot = entry.getKey();
                CardType card = registers.get(registerIndex);
                // AGAIN repeats the previous register; with nothing to repeat it does nothing.
                CardType effective = card == CardType.AGAIN ? lastEffective.get(robot) : card;
                if (effective != null) {
                    applyCard(board, robot, effective);
                    lastEffective.put(robot, effective);
                }
                cardsThisRegister.put(robot, card);
            }
            if (callback != null) {
                callback.onRegisterResolved(registerIndex + 1, cardsThisRegister);
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
                // POWER_UP and damage cards don't move the robot.
            }
        }
    }
}
