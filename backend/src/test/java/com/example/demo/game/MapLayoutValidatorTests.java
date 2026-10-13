package com.example.demo.game;

import com.example.demo.model.Tile;
import com.example.demo.model.layout.BoardKind;
import com.example.demo.model.layout.MapLayout;
import com.example.demo.model.layout.PlacedBoard;
import com.example.demo.service.MapLayoutService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class MapLayoutValidatorTests {

    private PlacedBoard start(int rotation) {
        return new PlacedBoard("start", BoardKind.START, 0, 0, rotation, com.example.demo.model.layout.StartBoardTemplate.tiles());
    }

    private PlacedBoard game(String id, int x, int y) {
        return new PlacedBoard(id, BoardKind.GAME, x, y, 0, List.of());
    }

    private String errors(PlacedBoard... boards) {
        return String.join(" ", MapLayoutValidator.validate(new MapLayout(List.of(boards))));
    }

    @ParameterizedTest
    @CsvSource({"0,3,0", "90,0,3", "180,-10,0", "270,0,-10"})
    void acceptsAllExitRotations(int rotation, int x, int y) {
        assertEquals("", errors(start(rotation), game("game", x, y)));
    }

    @ParameterizedTest
    @ValueSource(ints = {-9, -5, 0, 5, 9})
    void acceptsPartialEdgeConnections(int offset) {
        assertEquals("", errors(start(0), game("game", 3, offset)));
    }

    @Test
    void acceptsConnectedOffsetBoardsAndNegativePositions() {
        assertEquals("", errors(
                new PlacedBoard("start", BoardKind.START, -5, -3, 90, com.example.demo.model.layout.StartBoardTemplate.tiles()),
                new PlacedBoard("first", BoardKind.GAME, 0, 0, 270, List.of()),
                game("second", 10, 5),
                game("third", -10, 5)));
    }

    @Test
    void requiresExactlyOneStartAndAtLeastOneGame() {
        assertTrue(errors(game("game", 3, 0)).contains("Exactly one"));
        assertTrue(errors(start(0), start(90), game("game", 3, 0)).contains("Exactly one"));
        assertTrue(errors(start(0)).contains("At least one"));
        assertTrue(errors().contains("Exactly one"));
    }

    @Test
    void rejectsOverlapDisconnectedAndCornerOnlyLayouts() {
        assertTrue(errors(start(0), game("game", 2, 0)).contains("overlap"));
        assertTrue(errors(start(0), game("game", 3, 0), game("far", 30, 0)).contains("edge-connected"));
        assertTrue(errors(start(0), game("game", 3, 10)).contains("start board exit"));
        assertTrue(errors(start(0), game("game", 3, 0), game("corner", 13, 10)).contains("edge-connected"));
    }

    @ParameterizedTest
    @CsvSource({"0,0,-10", "0,0,10", "0,-10,0", "90,10,0", "180,3,0", "270,0,3"})
    void rejectsWrongStartEdges(int rotation, int x, int y) {
        assertTrue(errors(start(rotation), game("game", x, y)).contains("only along its exit edge"));
    }

    @Test
    void rejectsInvalidIdsKindsRotationsAndTiles() {
        assertTrue(errors(start(0), game("start", 3, 0)).contains("unique"));
        assertTrue(errors(start(0), game(" ", 3, 0)).contains("nonempty"));
        assertTrue(errors(start(45), game("game", 3, 0)).contains("rotation"));
        assertTrue(errors(start(0), new PlacedBoard("game", null, 3, 0, 0, List.of())).contains("kind"));

        for (var tiles : List.of(
                List.of(Tile.blank(-1, 0)),
                List.of(Tile.blank(10, 0)),
                List.of(Tile.blank(0, 10)),
                List.of(Tile.blank(0, 0), Tile.blank(0, 0)))) {
            assertTrue(errors(start(0), new PlacedBoard("game", BoardKind.GAME, 3, 0, 0, tiles)).contains("tile position"));
        }

        assertTrue(errors(new PlacedBoard("start", BoardKind.START, 0, 0, 90,
                List.of(Tile.blank(3, 0))), game("game", 0, 3)).contains("tile position"));
    }

    @Test
    void definitionsAreImmutableAndValidatedBeforeUse() {
        var tiles = new ArrayList<>(List.of(Tile.antenna(0, 0)));
        var boards = new ArrayList<>(List.of(
                new PlacedBoard("start", BoardKind.START, 0, 0, 0, tiles), game("game", 3, 0)));
        var layout = new MapLayout(boards);
        tiles.clear();
        boards.clear();

        assertEquals(2, layout.boards().size());
        assertEquals(1, layout.boards().getFirst().tiles().size());
        assertThrows(UnsupportedOperationException.class, () -> layout.boards().clear());
        assertThrows(UnsupportedOperationException.class, () -> layout.boards().getFirst().tiles().clear());
        assertThrows(IllegalArgumentException.class,
                () -> MapLayoutValidator.requireValid(new MapLayout(List.of(start(0)))));
        assertDoesNotThrow(() -> MapLayoutValidator.requireValid(new MapLayoutService().getDefaultLayout()));
    }
}
