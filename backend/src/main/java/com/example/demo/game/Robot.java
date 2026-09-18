package com.example.demo.game;

import com.example.demo.model.Direction;
import com.example.demo.model.Position;

/**
 * A player's robot on the board: its position, the direction it's facing,
 * and the movement/rotation operations that command cards trigger.
 *
 * Collision with other robots or board hazards is not handled here yet -
 * that belongs to a later activation-phase pass once GameBoard grows walls
 * and field elements.
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

    public String getPlayerId() {
        return playerId;
    }

    public Position getPosition() {
        return position;
    }

    public Direction getDirection() {
        return direction;
    }

    public void moveForward(GameBoard board, int spaces) {
        position = board.clampToBounds(position.moveIn(direction, spaces));
    }

    public void moveBackward(GameBoard board, int spaces) {
        position = board.clampToBounds(position.moveIn(direction.opposite(), spaces));
    }

    public void turnRight() {
        direction = direction.rotateRight();
    }

    public void turnLeft() {
        direction = direction.rotateLeft();
    }

    public void uTurn() {
        direction = direction.opposite();
    }
}
