package com.example.demo.game;

import com.example.demo.model.Direction;
import com.example.demo.model.Position;

/**
 * A player's robot on the board: its position, facing, and the movement/rotation
 * operations that command cards trigger.
 */
public class Robot {

    private final String playerId;
    private Position position;
    private Direction direction;

    public Robot(String playerId, Position startPosition, Direction startDirection) {
        this.playerId = playerId;
        this.position = startPosition;
        this.direction = startDirection;
    }

    public String getPlayerId() { return playerId; }
    public Position getPosition() { return position; }
    public Direction getDirection() { return direction; }

    /** Moves one space at a time to allow walls/pits/pushing */
    public void moveForward(GameBoard board, int spaces) {
        move(board, direction, spaces);
    }

    public void moveBackward(GameBoard board, int spaces) {
        move(board, direction.opposite(), spaces);
    }

    private void move(GameBoard board, Direction movementDirection, int spaces) {
        for (int i = 0; i < spaces; i++) {
            if (!board.canMove(position, movementDirection)) {
                break;
            }

            position = position.moveIn(movementDirection, 1);
        }
    }

    public void turnRight() {
        direction = direction.rotateRight();
        for (int i = 0; i < spaces; i++) {
            step(board, direction);
        }
    }

    public void moveBackward(GameBoard board, int spaces) {
        for (int i = 0; i < spaces; i++) {
            step(board, direction.opposite());
        }
    }

    private void step(GameBoard board, Direction stepDirection) {
        position = board.clampToBounds(position.moveIn(stepDirection, 1));
    }

    public void turnRight() { direction = direction.rotateRight(); }
    public void turnLeft() { direction = direction.rotateLeft(); }
    public void uTurn() { direction = direction.opposite(); }
}
