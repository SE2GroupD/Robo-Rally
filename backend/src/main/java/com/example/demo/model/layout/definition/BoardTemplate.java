package com.example.demo.model.layout.definition;

import com.example.demo.model.Tile;
import com.example.demo.model.layout.BoardKind;
import java.util.List;

public record BoardTemplate(String id, String name, BoardKind kind, int width, int height, List<Tile> tiles) {

    public BoardTemplate {
        tiles = List.copyOf(tiles);
    }
}
