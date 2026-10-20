package com.example.demo.model.layout;

import com.example.demo.model.Tile;

import java.util.List;

/** Position is the rotated top-left; tile coordinates remain local and unrotated. */
public record PlacedBoard(String id, BoardKind kind, int x, int y, int rotation, List<Tile> tiles) {

    public PlacedBoard {
        tiles = List.copyOf(tiles);
    }
}
