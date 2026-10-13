package com.example.demo.model.layout;

import com.example.demo.model.Tile;
import com.example.demo.model.Walls;

import java.util.List;

/** The single canonical start-board definition, in unrotated local coordinates. */
public final class StartBoardTemplate {

    private StartBoardTemplate() {
    }

    public static List<Tile> tiles() {
        return TILES;
    }

    private static final List<Tile> TILES = List.of(
            Tile.spawnPoint(1, 1),
            Tile.spawnPoint(0, 3),
            Tile.spawnPoint(1, 4),
            Tile.spawnPoint(1, 5),
            Tile.spawnPoint(0, 6),
            Tile.spawnPoint(1, 8),
            Tile.withWalls(1, 2, new Walls(true, false, false, false)),
            Tile.withWalls(2, 4, new Walls(false, true, false, false)),
            Tile.withWalls(2, 5, new Walls(false, true, false, false)),
            Tile.withWalls(1, 7, new Walls(false, false, true, false)));
}
