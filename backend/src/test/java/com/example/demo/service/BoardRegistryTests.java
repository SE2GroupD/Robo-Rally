package com.example.demo.service;

import com.example.demo.model.BoardDefinition;
import com.example.demo.model.Tile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

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
    void fallbacksToDefaultBoardWhenUnknownIdIsRequested() {
        BoardDefinition fallback = registry.getBoard("non_existent_map");
        assertNotNull(fallback, "Should fallback to classic_start when board is unknown");
        assertEquals("classic_start", fallback.id());
    }
}