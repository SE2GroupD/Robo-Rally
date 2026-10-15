package com.example.demo.service;

import com.example.demo.game.GameBoard;
import com.example.demo.model.BoardDefinition;
import com.example.demo.model.Tile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class BoardRegistryTests {

    private BoardRegistry registry;

    @BeforeEach
    void setUp() {
        registry = new BoardRegistry();
        registry.loadBoards();
    }

    @Test
    void loadsClassicStartBoardWithExactSpecifications() {
        BoardDefinition board = registry.getBoard("classic_start");

        assertNotNull(board, "classic_start should be loaded from classpath");
        assertEquals("classic_start", board.id());
        assertEquals(3, board.width());
        assertEquals(10, board.height());

        // Vérification des 6 points d'apparition
        long spawnCount = board.specialTiles().stream().filter(Tile::isSpawnPoint).count();
        assertEquals(6, spawnCount, "Classic start board must contain exactly 6 spawn points");

        // Vérification de la présence de l'antenne
        boolean hasAntenna = board.specialTiles().stream().anyMatch(Tile::hasAntenna);
        assertTrue(hasAntenna, "Classic start board must contain the priority antenna");
    }

    @Test
    void loadsStandardGameBoardsWithCheckpointsAndObjects() {
        BoardDefinition game1 = registry.getBoardById("game1");
        BoardDefinition game2 = registry.getBoardById("game2");
        BoardDefinition game3 = registry.getBoardById("game3");

        assertNotNull(game1, "game1 should be loaded");
        assertEquals(10, game1.width());
        assertEquals(10, game1.height());

        assertNotNull(game2, "game2 should be loaded");
        boolean hasCheckpoint1 = game2.specialTiles().stream().anyMatch(t -> Integer.valueOf(1).equals(t.checkpointNumber()));
        assertTrue(hasCheckpoint1, "game2 should have checkpoint 1");

        assertNotNull(game3, "game3 should be loaded");
        boolean hasCheckpoint2 = game3.specialTiles().stream().anyMatch(t -> Integer.valueOf(2).equals(t.checkpointNumber()));
        boolean hasCheckpoint3 = game3.specialTiles().stream().anyMatch(t -> Integer.valueOf(3).equals(t.checkpointNumber()));
        assertTrue(hasCheckpoint2, "game3 should have checkpoint 2");
        assertTrue(hasCheckpoint3, "game3 should have checkpoint 3");
    }

    @Test
    void assemblesStartBoardAndGameBoardsCorrectly() {
        BoardDefinition start = registry.getBoard("classic_start");
        BoardDefinition game1 = registry.getBoardById("game1");
        BoardDefinition game2 = registry.getBoardById("game2");
        BoardDefinition game3 = registry.getBoardById("game3");

        GameBoard combined = GameBoard.assemble(List.of(start, game1, game2, game3));

        assertEquals(33, combined.getWidth());
        assertEquals(10, combined.getHeight());

        // Start board antenna at x=0
        assertTrue(combined.getSpecialTiles().stream().anyMatch(t -> t.x() == 0 && t.y() == 4 && t.hasAntenna()));

        // Start board spawn point at x=1, y=1
        assertTrue(combined.getSpecialTiles().stream().anyMatch(t -> t.x() == 1 && t.y() == 1 && t.isSpawnPoint()));

        // Checkpoint 1 on game2 originally at x=3, translated by 3 (start) + 10 (game1) = 13 -> x = 16, y = 3
        assertTrue(combined.getSpecialTiles().stream().anyMatch(t -> t.x() == 16 && t.y() == 3 && Integer.valueOf(1).equals(t.checkpointNumber())));

        // Checkpoint 2 on game3 originally at x=8, translated by 3 + 10 + 10 = 23 -> x = 31, y = 2
        assertTrue(combined.getSpecialTiles().stream().anyMatch(t -> t.x() == 31 && t.y() == 2 && Integer.valueOf(2).equals(t.checkpointNumber())));

        // Checkpoint 3 on game3 originally at x=1, translated by 23 -> x = 24, y = 7
        assertTrue(combined.getSpecialTiles().stream().anyMatch(t -> t.x() == 24 && t.y() == 7 && Integer.valueOf(3).equals(t.checkpointNumber())));
    }

    @Test
    void fallbacksToDefaultBoardWhenUnknownIdIsRequested() {
        BoardDefinition fallback = registry.getBoard("non_existent_map");
        assertNotNull(fallback, "Should fallback to classic_start when board is unknown");
        assertEquals("classic_start", fallback.id());
    }
}