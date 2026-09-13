package com.example.demo.game;

import com.example.demo.model.Position;

/**
 * The grid a game is played on.
 */
public class GameBoard {

    private final int width;
    private final int height;

    /*
     * This is intentionally minimal for now: just dimensions and bounds-clamping.
     * Walls, pits, conveyor belts, gears, and checkpoints (see Space/FieldElement
     * in the design diagram) are a separate piece of work layered on top of this.
     */
    public GameBoard(int width, int height) {
        if (width <= 0 || height <= 0) {
            throw new IllegalArgumentException("Board dimensions must be positive.");
        }
        this.width = width;
        this.height = height;
    }

    public int getWidth() {
        return width;
    }

    public int getHeight() {
        return height;
    }


    /*
     * Clamping a robot to the board edge is a placeholder behavior. The real
     * RoboRally rule is that a robot moving off the board (or into a pit) falls
     * off and is destroyed/re-spawned - that requires the hazard system above,
     * so for now robots simply stop at the edge instead of falling off.
     */
    public Position clampToBounds(Position position) {
        int clampedX = Math.clamp(position.x(), 0, width - 1);
        int clampedY = Math.clamp(position.y(), 0, height - 1);
        return new Position(clampedX, clampedY);
    }
}
