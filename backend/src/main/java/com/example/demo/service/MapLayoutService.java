package com.example.demo.service;

import com.example.demo.game.MapLayoutValidator;
import com.example.demo.model.Tile;
import com.example.demo.model.layout.BoardKind;
import com.example.demo.model.layout.MapLayout;
import com.example.demo.model.layout.PlacedBoard;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MapLayoutService {

    private final MapLayout defaultLayout;

    public MapLayoutService() {
        defaultLayout = new MapLayout(List.of(
                new PlacedBoard("start", BoardKind.START, 0, 0, 0, List.of(
                        Tile.antenna(0, 0),
                        Tile.spawnPoint(1, 4))),
                new PlacedBoard("game-1", BoardKind.GAME, 3, 0, 0, List.of(
                        Tile.checkpoint(8, 4, 1)))));

        MapLayoutValidator.requireValid(defaultLayout);
    }

    /** Preview definition only; does not create or modify a live game. */
    public MapLayout getDefaultLayout() {
        return defaultLayout;
    }
}
