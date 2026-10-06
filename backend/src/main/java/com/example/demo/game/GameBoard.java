package com.example.demo.game;

import com.example.demo.model.Conveyor;
import com.example.demo.model.Direction;
import com.example.demo.model.GearRotation;
import com.example.demo.model.Position;
import com.example.demo.model.Tile;
import com.example.demo.model.Walls;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** The grid a game is played on. */
public class GameBoard {

    private final int width;
    private final int height;
    private final Map<Position, Tile> specialTiles;
    private final List<Position> spawnPositions;

    public GameBoard(int width, int height, List<Tile> seedTiles, List<Position> spawnPositions) {
        if (width <= 0 || height <= 0) {
            throw new IllegalArgumentException("Board dimensions must be positive.");
        }
        this.width = width;
        this.height = height;
        this.specialTiles = new HashMap<>();
        for (Tile tile : seedTiles) {
            this.specialTiles.put(new Position(tile.x(), tile.y()), tile);
        }
        this.spawnPositions = List.copyOf(spawnPositions);
    }

    public int getWidth() { return width; }
    public int getHeight() { return height; }

    /** For sending the special tiles over the API. */
    public List<Tile> getSpecialTiles() {
        return List.copyOf(specialTiles.values());
    }

    /** Where new robots are placed, in assignment order. */
    public List<Position> getSpawnPositions() {
        return spawnPositions;
    }

    /**
     * Placeholder: robots stop at the board edge. Real rules (fall off / pit =
     * destroyed and respawned) come with the hazard system.
     */
    public Position clampToBounds(Position position) {
        int clampedX = Math.clamp(position.x(), 0, width - 1);
        int clampedY = Math.clamp(position.y(), 0, height - 1);
        return new Position(clampedX, clampedY);
    }


    public boolean canMove(Position from, Direction direction) {
        Position to = from.moveIn(direction, 1);

        // Prevent movement outside the board
        if (to.x() < 0 || to.x() >= width || to.y() < 0 || to.y() >= height) {
            return false;
        }

        // A wall can be stored either on the current tile
        // or on the neighbouring tile.
        return !hasWall(from, direction)
                && !hasWall(to, direction.opposite());
    }

    private boolean hasWall(Position position, Direction direction) {
        Tile tile = specialTiles.get(position);

        // Normal tiles have no walls
        if (tile == null || tile.walls() == null) {
            return false;
        }

        Walls walls = tile.walls();

        return switch (direction) {
            case NORTH -> walls.north();
            case EAST -> walls.east();
            case SOUTH -> walls.south();
            case WEST -> walls.west();
        };
    }

    public Integer checkpointAt(Position position) {
        Tile tile = specialTiles.get(position);
        return tile == null ? null : tile.checkpointNumber();
    }

    public static GameBoard classicWithSeedTiles() {
        List<Position> spawns = List.of(
                new Position(0, 1), new Position(0, 2), new Position(0, 3),
                new Position(0, 4), new Position(0, 5), new Position(0, 6));

        List<Tile> tiles = new ArrayList<>(List.of(
                Tile.pit(5, 5),
                Tile.pit(6, 5),
                Tile.gearTile(2, 2, GearRotation.CLOCKWISE),
                Tile.conveyorTile(4, 4, new Conveyor(Direction.NORTH, true)),
                Tile.conveyorTile(4, 3, new Conveyor(Direction.NORTH, true)),
                Tile.withWalls(8, 8, new Walls(true, false, false, true)),
                Tile.antenna(0, 0),
                Tile.checkpoint(10, 10, 1)));
        for (Position spawn : spawns) {
            tiles.add(Tile.spawnPoint(spawn.x(), spawn.y()));
        }
        return new GameBoard(12, 12, tiles, spawns);
    }
}
