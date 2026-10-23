package com.example.demo.model;

/** An (x, y) coordinate on the game board. */
public record Position(int x, int y) {

    /** Returns the position reached by moving {@code spaces} steps in {@code direction}. */
    public Position moveIn(Direction direction, int spaces) {
        return new Position(x + direction.getDx() * spaces, y + direction.getDy() * spaces);
    }
}
