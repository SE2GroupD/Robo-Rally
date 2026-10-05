package com.example.demo.game;

import com.example.demo.model.BoardDefinition;
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

    public GameBoard(int width, int height, List<Tile> seedTiles) {
        this(width, height, seedTiles, seedTiles.stream()
                .filter(Tile::isSpawnPoint)
                .map(t -> new Position(t.x(), t.y()))
                .toList());
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

    public static GameBoard assemble(List<BoardDefinition> boardDefinitions) {
        int totalWidth = 0;
        int maxHeight = 0;
        List<Tile> combinedTiles = new ArrayList<>();
        List<Position> combinedSpawns = new ArrayList<>();

        for (BoardDefinition def : boardDefinitions) {
            if (def == null) continue;
            int xOffset = totalWidth;
            if (def.specialTiles() != null) {
                for (Tile tile : def.specialTiles()) {
                    Tile translatedTile = new Tile(
                            tile.x() + xOffset,
                            tile.y(),
                            tile.hasPit(),
                            tile.walls(),
                            tile.hasAntenna(),
                            tile.isSpawnPoint(),
                            tile.gear(),
                            tile.conveyor(),
                            tile.checkpointNumber(),
                            tile.occupyingPlayerId()
                    );
                    combinedTiles.add(translatedTile);
                    if (translatedTile.isSpawnPoint()) {
                        combinedSpawns.add(new Position(translatedTile.x(), translatedTile.y()));
                    }
                }
            }
            totalWidth += def.width();
            maxHeight = Math.max(maxHeight, def.height());
        }

        return new GameBoard(totalWidth, maxHeight, combinedTiles, combinedSpawns);
    }

    public static GameBoard classicWithSeedTiles() {
        List<Position> spawns = List.of(
                new Position(1, 1), new Position(1, 2), new Position(1, 3),
                new Position(1, 6), new Position(1, 7), new Position(1, 8));

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

    public List<Position> getAvailableStartTiles() {
        return specialTiles.values().stream()
                .filter(Tile::isAvailableSpawn)
                .map(tile -> new Position(tile.x(), tile.y()))
                .toList(); 
    }

    public void updateTileOccupant(Position pos, String playerId) {
        Tile existingTile = specialTiles.get(pos);
        if (existingTile != null && existingTile.isSpawnPoint()) {
            Tile updatedTile = existingTile.withOccupant(playerId);
            specialTiles.put(pos, updatedTile);
        }
    }

    public List<Tile> getSpawnPointList() {
        return specialTiles.values().stream()
                .filter(Tile::isSpawnPoint)
                .toList(); 
    }
}
