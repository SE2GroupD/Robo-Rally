package com.example.demo.game;

import com.example.demo.model.Conveyor;
import com.example.demo.model.Direction;
import com.example.demo.model.GearRotation;
import com.example.demo.model.Position;
import com.example.demo.model.PushPanel;
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
     * Whether a robot (or anything else) can step one tile from {@code from}
     * in {@code direction}. The board edge counts as a wall for now.
     */
    public boolean canMove(Position from, Direction direction) {
        Position to = from.moveIn(direction, 1);

        // Prevent movement outside the board
        if (to.x() < 0 || to.x() >= width || to.y() < 0 || to.y() >= height) {
            return false;
        }

        // A wall can be stored either on the current tile or on the neighbouring tile.
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

    /** The belt on this tile, or null. */
    public Conveyor conveyorAt(Position p) {
        Tile tile = specialTiles.get(p);
        return tile == null ? null : tile.conveyor();
    }

    /** The push panel on this tile, or null. */
    public PushPanel pushPanelAt(Position p) {
        Tile tile = specialTiles.get(p);
        return tile == null ? null : tile.pushPanel();
    }

    public static GameBoard classicWithSeedTiles() {
        List<Position> spawns = List.of(
                new Position(0, 1), new Position(0, 2), new Position(0, 3),
                new Position(0, 4), new Position(0, 5), new Position(0, 6));

        List<Tile> tiles = new ArrayList<>(List.of(
                Tile.pit(5, 5),
                Tile.pit(6, 5),
                Tile.gearTile(2, 2, GearRotation.CLOCKWISE),
                Tile.withWalls(8, 8, new Walls(true, false, false, true)),
                Tile.antenna(0, 0),
                Tile.checkpoint(10, 10, 1)));

        // Express belt north (existing).
        tiles.add(Tile.conveyorTile(4, 4, new Conveyor(Direction.NORTH, true)));
        tiles.add(Tile.conveyorTile(4, 3, new Conveyor(Direction.NORTH, true)));
        // Regular belt east with a corner turning south.
        tiles.add(Tile.conveyorTile(2, 7, new Conveyor(Direction.EAST)));
        tiles.add(Tile.conveyorTile(3, 7, new Conveyor(Direction.EAST)));
        tiles.add(Tile.conveyorTile(4, 7, new Conveyor(Direction.EAST)));
        tiles.add(Tile.conveyorTile(5, 7, new Conveyor(Direction.SOUTH)));
        tiles.add(Tile.conveyorTile(5, 8, new Conveyor(Direction.SOUTH)));
        // Express belt east.
        for (int x = 1; x <= 4; x++) {
            tiles.add(Tile.conveyorTile(x, 10, new Conveyor(Direction.EAST, true)));
        }
        // Push panels.
        tiles.add(Tile.pushPanelTile(7, 2, new PushPanel(Direction.SOUTH, List.of(1, 3, 5))));
        tiles.add(Tile.pushPanelTile(9, 3, new PushPanel(Direction.WEST, List.of(2, 4))));

        for (Position spawn : spawns) {
            tiles.add(Tile.spawnPoint(spawn.x(), spawn.y()));
        }
        return new GameBoard(12, 12, tiles, spawns);
    }
}
