package com.example.demo.game;

import com.example.demo.model.Direction;
import com.example.demo.model.Position;

/**
 * A player's robot: position and facing. Anything that moves a robot across the
 * board (cards, belts, pushing) lives in MovementResolver, since it needs to know
 * about walls and other robots.
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
    public void moveTo(Position newPosition) { position = newPosition; }

    public void turnRight() { direction = direction.rotateRight(); }
    public void turnLeft() { direction = direction.rotateLeft(); }
    public void uTurn() { direction = direction.opposite(); }
}