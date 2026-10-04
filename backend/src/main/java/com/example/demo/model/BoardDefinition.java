package com.example.demo.model;

import java.util.List;

public record BoardDefinition(
        String id,
        String name,
        int width,
        int height,
        List<Tile> specialTiles
) {}