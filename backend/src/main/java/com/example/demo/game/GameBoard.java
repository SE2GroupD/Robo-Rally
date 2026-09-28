package com.example.demo.game;

import com.example.demo.model.Position;
import com.example.demo.model.Tile;
import com.example.demo.model.Conveyor;
import com.example.demo.model.Direction;
import com.example.demo.model.GearRotation;
import com.example.demo.model.Walls;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


/**
 * The grid a game is played on.
 */
public class GameBoard {

    private final int width;
    private final int height;
    private final Map<Position, Tile> specialTiles;

    public GameBoard(int width, int height) {
        this(width, height, List.of());
    }

    /*
     * This is intentionally minimal for now: just dimensions and bounds-clamping.
     * Walls, pits, conveyor belts, gears, and checkpoints (see Space/FieldElement
     * in the design diagram) are a separate piece of work layered on top of this.
     */
    public GameBoard(int width, int height, List<Tile> seedTiles) {
        if (width <= 0 || height <= 0) {
            throw new IllegalArgumentException("Board dimensions must be positive.");
        }
        this.width = width;
        this.height = height;
        this.specialTiles = new HashMap<>();
        for (Tile tile : seedTiles) {
            this.specialTiles.put(new Position(tile.x(), tile.y()), tile);
        }
    }

    public int getWidth() {
        return width;
    }

    public int getHeight() {
        return height;
    }

    //For sending the special tiles over API
    public List<Tile> getSpecialTiles() {
        return List.copyOf(specialTiles.values());
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

    public static GameBoard classicWithSeedTiles() {
        return new GameBoard(12, 12, List.of(
                Tile.pit(5, 5),
                Tile.pit(6, 5),
                Tile.gearTile(2, 2, GearRotation.CLOCKWISE),
                Tile.conveyorTile(4, 4, new Conveyor(Direction.NORTH, true)),
                Tile.conveyorTile(4, 3, new Conveyor(Direction.NORTH, true)),
                Tile.withWalls(8, 8, new Walls(true, false, false, true)),
                Tile.antenna(0, 0),
                Tile.spawnPoint(0, 1),
                Tile.spawnPoint(0, 2),
                Tile.checkpoint(10, 10, 1)
        ));
    }
}
