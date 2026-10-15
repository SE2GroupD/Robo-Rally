package com.example.demo.game;

import com.example.demo.model.Direction;
import com.example.demo.model.Position;
import com.example.demo.model.Tile;
import com.example.demo.service.MapLayoutService;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ChopShopChallengeTests {

    private final MapLayoutService catalog = new MapLayoutService();

    @Test
    void composesThreeBoardsAndTranslatesAllSixCheckpoints() {
        var layout = catalog.getLayout("chop-shop-challenge");
        var board = GameBoard.training(layout);

        assertEquals("Chop Shop Challenge", layout.name());
        assertEquals(3, layout.boards().size());
        assertEquals(23, board.getWidth());
        assertEquals(10, board.getHeight());
        assertEquals(catalog.getDefaultLayout().boards().getFirst().tiles(), layout.boards().getFirst().tiles());
        assertEquals(6, board.getSpawnPositions().size());
        assertEquals(new Position(1, 1), board.getSpawnPositions().getFirst());

        var checkpoints = List.of(new Position(6, 6), new Position(10, 4), new Position(14, 7),
                new Position(22, 1), new Position(17, 3), new Position(22, 9));

        for (int index = 0; index < checkpoints.size(); index++) {
            assertEquals(index + 1, board.checkpointAt(checkpoints.get(index)));
        }

        assertTrue(board.canMove(new Position(2, 2), Direction.EAST));
        assertTrue(board.canMove(new Position(12, 5), Direction.EAST));
        assertTrue(board.canMove(new Position(13, 5), Direction.WEST));
    }

    @Test
    void board3aPanelsFaceAwayFromTheirBackingWallsAndActivateOnEvenRegisters() {
        var board = GameBoard.training(catalog.getLayout("chop-shop-challenge"));

        for (var position : List.of(new Position(15, 4), new Position(19, 4))) {
            var direction = position.x() == 15 ? Direction.WEST : Direction.EAST;
            var backingWall = direction == Direction.WEST ? Direction.EAST : Direction.WEST;
            var panel = board.pushPanelAt(position);

            assertNotNull(panel);
            assertEquals(direction, panel.direction());
            assertEquals(List.of(2, 4), panel.activeRegisters());
            assertFalse(panel.isActiveIn(1));
            assertTrue(panel.isActiveIn(2));
            assertFalse(board.canMove(position, backingWall));
            assertTrue(board.canMove(position, direction));
        }
    }

    @Test
    void preservesPitsBeltsGearsAndPanelBackingWalls() {
        var layout = catalog.getLayout("chop-shop-challenge");
        var workshop = layout.boards().get(1).tiles();
        var crossing = layout.boards().get(2).tiles();
        var board = GameBoard.training(layout);

        assertEquals(10, workshop.stream().filter(Tile::hasPit).count());
        assertEquals(23, workshop.stream().filter(tile -> tile.conveyor() != null).count());
        assertEquals(12, workshop.stream().filter(tile -> tile.pushPanel() != null).count());
        assertEquals(2, crossing.stream().filter(Tile::hasPit).count());
        assertEquals(11, crossing.stream().filter(tile -> tile.conveyor() != null && tile.conveyor().isExpress()).count());
        assertEquals(13, crossing.stream().filter(tile -> tile.conveyor() != null && !tile.conveyor().isExpress()).count());
        assertEquals(5, crossing.stream().filter(tile -> tile.gear() != null).count());
        assertEquals(2, crossing.stream().filter(tile -> tile.pushPanel() != null).count());

        var evenPanel = board.pushPanelAt(new Position(4, 1));
        assertEquals(Direction.SOUTH, evenPanel.direction());
        assertEquals(List.of(2, 4), evenPanel.activeRegisters());
        assertFalse(board.canMove(new Position(4, 1), Direction.NORTH));

        var oddPanel = board.pushPanelAt(new Position(5, 2));
        assertEquals(Direction.EAST, oddPanel.direction());
        assertEquals(List.of(1, 3, 5), oddPanel.activeRegisters());
        assertFalse(board.canMove(new Position(5, 2), Direction.WEST));
        assertTrue(board.canMove(new Position(5, 2), Direction.EAST));
    }
}
