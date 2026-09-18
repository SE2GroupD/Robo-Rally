package com.example.demo.model;

/**
 * The four directions a robot can face on the board.
 *
 * Coordinate convention: NORTH decreases y, SOUTH increases y (i.e. y grows
 * downward, like a row-major 2D array or a canvas). EAST increases x, WEST
 * decreases x.
 */
public enum Direction {
    NORTH(0, -1),
    EAST(1, 0),
    SOUTH(0, 1),
    WEST(-1, 0);

    private final int dx;
    private final int dy;

    Direction(int dx, int dy) {
        this.dx = dx;
        this.dy = dy;
    }

    public int getDx() {
        return dx;
    }

    public int getDy() {
        return dy;
    }

    /** Rotates 90 degrees clockwise, as if the robot played a TURN_RIGHT card. */
    public Direction rotateRight() {
        return values()[(this.ordinal() + 1) % 4];
    }

    /** Rotates 90 degrees counter-clockwise, as if the robot played a TURN_LEFT card. */
    public Direction rotateLeft() {
        return values()[(this.ordinal() + 3) % 4];
    }

    /** 180 degree turn, as if the robot played a U_TURN card. */
    public Direction opposite() {
        return values()[(this.ordinal() + 2) % 4];
    }
}
