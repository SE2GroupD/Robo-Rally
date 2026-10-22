package com.example.demo.game;

import com.example.demo.model.Direction;
import com.example.demo.model.GearRotation;
import com.example.demo.model.Position;
import com.example.demo.service.GameServiceImpl;
import com.example.demo.service.MapLayoutService;
import com.example.demo.service.RoomServiceImpl;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RiskyCrossingTests {

    @Test
    void referenceObjectsAndCheckpointsCompileToGlobalCoordinates() {
        var layout = new MapLayoutService().getLayout("risky-crossing");
        var tiles = layout.boards().get(1).tiles();
        var board = GameBoard.training(layout);

        assertEquals(new MapLayoutService().getDefaultLayout().boards().getFirst().tiles(), layout.boards().getFirst().tiles());
        assertEquals(13, board.getWidth());
        assertEquals(10, board.getHeight());
        assertEquals(47, tiles.size());
        assertEquals(28, tiles.stream().filter(t -> t.conveyor() != null && !t.conveyor().isExpress()).count());
        assertEquals(16, tiles.stream().filter(t -> t.conveyor() != null && t.conveyor().isExpress()).count());
        assertTrue(tiles.stream().noneMatch(t -> t.hasPit() || t.hasAntenna() || t.isSpawnPoint()
                || t.walls() != null || t.pushPanel() != null));
        assertEquals(1, board.checkpointAt(new Position(8, 7)));
        assertEquals(2, board.checkpointAt(new Position(11, 0)));
        assertEquals(GearRotation.CLOCKWISE, board.gearAt(new Position(4, 9)));
    }

    @Test
    void regularBeltFormsThePicturedClosedLoopAndExpressPathsExitAtCorners() {
        var board = GameBoard.training(new MapLayoutService().getLayout("risky-crossing"));
        var start = new Position(6, 1);
        var position = start;
        var visited = new HashSet<Position>();

        do {
            assertTrue(visited.add(position), "Loop repeated before returning to its start.");
            var belt = board.conveyorAt(position);
            assertNotNull(belt);
            assertFalse(belt.isExpress());
            position = position.moveIn(belt.direction(), 1);
        } while (!position.equals(start));

        assertEquals(28, visited.size());

        // Each path is listed from its entry to the last tile on board 5A.
        for (var path : List.of(
                List.of(new Position(4, 0), new Position(4, 1), new Position(4, 2), new Position(3, 2), new Position(2, 2)),
                List.of(new Position(12, 1), new Position(11, 1), new Position(10, 1), new Position(10, 0), new Position(10, -1)),
                List.of(new Position(3, 8), new Position(4, 8), new Position(5, 8), new Position(5, 9), new Position(5, 10)),
                List.of(new Position(11, 9), new Position(11, 8), new Position(11, 7), new Position(12, 7), new Position(13, 7)))) {
            for (int i = 0; i < path.size() - 1; i++) {
                var belt = board.conveyorAt(path.get(i));
                assertNotNull(belt);
                assertTrue(belt.isExpress());
                assertEquals(path.get(i + 1), path.get(i).moveIn(belt.direction(), 1));
            }
        }
    }

    @Test
    void catalogSelectionStartsTheActualCourseAndRequiresCheckpointsInOrder() {
        var catalog = new MapLayoutService();
        var rooms = new RoomServiceImpl(catalog);
        var room = rooms.createRoom("Pilot", "pilot", true);
        rooms.selectMap(room.gameId(), "pilot", "risky-crossing");
        rooms.startRoom(room.gameId(), "pilot");

        var state = new GameServiceImpl(rooms).getBoardState(room.gameId(), "pilot");
        assertEquals(new MapLayoutService().getLayout("risky-crossing"), state.layout());
        assertEquals(1, state.robots().getFirst().x());
        assertEquals(1, state.robots().getFirst().y());
        assertEquals("extra-crispy", catalog.getDefaultLayout().id());

        var board = GameBoard.training(state.layout());
        var session = new GameSession(board);
        session.addPlayer("pilot", board.getSpawnPositions().getFirst(), Direction.EAST);
        var robot = session.getRobots().get("pilot");
        robot.moveTo(new Position(11, 0));
        assertFalse(session.claimCheckpointIfNext(robot));
        robot.moveTo(new Position(8, 7));
        assertTrue(session.claimCheckpointIfNext(robot));
        robot.moveTo(new Position(11, 0));
        assertTrue(session.claimCheckpointIfNext(robot));
        assertEquals(List.of(1, 2), session.getCompletedCheckpointsFor("pilot"));
    }
}
