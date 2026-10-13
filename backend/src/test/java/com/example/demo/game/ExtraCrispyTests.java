package com.example.demo.game;

import com.example.demo.model.*;
import com.example.demo.model.layout.*;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

class ExtraCrispyTests {

    @Test
    void startTemplateHasExactlyTheRequestedObjectsInSpawnOrder() {
        var tiles = StartBoardTemplate.tiles();
        var spawns = tiles.stream().filter(Tile::isSpawnPoint).map(t -> new Position(t.x(), t.y())).toList();

        assertEquals(List.of(new Position(1, 1), new Position(0, 3), new Position(1, 4),
                new Position(1, 5), new Position(0, 6), new Position(1, 8)), spawns);
        assertEquals(10, tiles.size());
        assertEquals(new Walls(true, false, false, false), at(tiles, 1, 2).walls());
        assertEquals(new Walls(false, true, false, false), at(tiles, 2, 4).walls());
        assertEquals(new Walls(false, true, false, false), at(tiles, 2, 5).walls());
        assertEquals(new Walls(false, false, true, false), at(tiles, 1, 7).walls());
        assertTrue(tiles.stream().noneMatch(t -> t.hasPit() || t.hasAntenna() || t.gear() != null
                || t.conveyor() != null || t.checkpointNumber() != null));
    }

    @Test
    void checkpointsSurviveGlobalCompilation() {
        var layout = ExtraCrispy.layout();
        var local = layout.boards().get(1).tiles();
        var board = GameBoard.training(layout);
        int[][] checkpoints = {{7, 2}, {2, 7}, {7, 7}, {2, 2}};

        for (int i = 0; i < checkpoints.length; i++) {
            int x = checkpoints[i][0];
            int y = checkpoints[i][1];
            assertEquals(i + 1, at(local, x, y).checkpointNumber());
            assertEquals(i + 1, board.checkpointAt(new Position(x + 3, y)));
        }

        assertEquals(new Position(1, 1), board.getSpawnPositions().getFirst());
        assertFalse(board.canMove(new Position(1, 2), Direction.NORTH));
        assertFalse(board.canMove(new Position(1, 1), Direction.SOUTH));
        assertFalse(board.canMove(new Position(2, 4), Direction.EAST));
        assertTrue(board.canMove(new Position(2, 1), Direction.EAST));
    }

    @Test
    void referenceTerrainHasEightPitsAndBothBeltSpeeds() {
        var tiles = ExtraCrispy.layout().boards().get(1).tiles();
        Set<Position> pits = tiles.stream().filter(Tile::hasPit).map(t -> new Position(t.x(), t.y())).collect(Collectors.toSet());

        assertEquals(Set.of(new Position(3, 2), new Position(6, 2), new Position(3, 3), new Position(6, 3),
                new Position(3, 6), new Position(6, 6), new Position(3, 7), new Position(6, 7)), pits);
        assertEquals(18, tiles.stream().filter(t -> t.conveyor() != null && t.conveyor().isExpress()).count());
        assertEquals(4, tiles.stream().filter(t -> t.conveyor() != null && !t.conveyor().isExpress()).count());
        assertEquals(GearRotation.CLOCKWISE, at(tiles, 3, 4).gear());
        assertEquals(GearRotation.COUNTERCLOCKWISE, at(tiles, 6, 5).gear());
    }

    @Test
    void rejectsModifiedStartTemplateButAcceptsRotation() {
        var layout = ExtraCrispy.layout();
        var game = layout.boards().get(1);
        var invalid = new PlacedBoard("start", BoardKind.START, 0, 0, 0, List.of(Tile.spawnPoint(1, 1)));

        assertTrue(MapLayoutValidator.validate(new MapLayout(List.of(invalid, game))).contains("Start board must match the permanent template."));
        assertEquals(List.of(), MapLayoutValidator.validate(new MapLayout(List.of(
                new PlacedBoard("start", BoardKind.START, 0, 0, 90, StartBoardTemplate.tiles()),
                new PlacedBoard("game", BoardKind.GAME, 0, 3, 0, game.tiles())))));
    }

    @Test
    void requiresAllFourCheckpointsInOrder() {
        var board = GameBoard.training(ExtraCrispy.layout());
        var session = new GameSession(board);
        session.addPlayer("pilot", board.getSpawnPositions().getFirst(), Direction.EAST);
        var robot = session.getRobots().get("pilot");

        robot.moveTo(new Position(5, 2));
        assertFalse(session.claimCheckpointIfNext(robot));

        for (var position : List.of(new Position(10, 2), new Position(5, 7), new Position(10, 7), new Position(5, 2))) {
            robot.moveTo(position);
            assertTrue(session.claimCheckpointIfNext(robot));
        }

        assertEquals(List.of(1, 2, 3, 4), session.getCompletedCheckpointsFor("pilot"));
    }

    private Tile at(List<Tile> tiles, int x, int y) {
        return tiles.stream().filter(t -> t.x() == x && t.y() == y).findFirst().orElseThrow();
    }
}
