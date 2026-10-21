package com.example.demo.service;

import com.example.demo.game.GameBoard;
import com.example.demo.game.Robot;
import com.example.demo.model.Direction;
import com.example.demo.model.Position;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;

class TrainingMapTests {

    @Test
    void trainingAndNewMultiplayerRoomsUseDefaultLayout() {
        var rooms = new RoomServiceImpl();
        var layouts = new MapLayoutService();
        var games = new GameServiceImpl(rooms);
        var training = rooms.createRoom("Pilot", "pilot", true);

        assertThrows(ResponseStatusException.class, () -> rooms.joinRoom(training.roomCode(), "Guest", "guest"));
        rooms.selectRobot(training.gameId(), "pilot", 2);
        rooms.startRoom(training.gameId(), "pilot");

        var state = games.getBoardState(training.gameId(), "pilot");

        assertEquals(13, state.width());
        assertEquals(10, state.height());
        assertEquals(layouts.getDefaultLayout(), state.layout());
        assertEquals(4, state.totalCheckpoints());
        assertEquals(1, state.robots().getFirst().x());
        assertEquals(1, state.robots().getFirst().y());
        assertTrue(state.tiles().stream().anyMatch(tile -> tile.x() == 10 && tile.y() == 2 && Integer.valueOf(1).equals(tile.checkpointNumber())));

        var multiplayer = rooms.createRoom("Host", "host");
        rooms.startRoom(multiplayer.gameId(), "host");
        var classic = games.getBoardState(multiplayer.gameId(), "host");

        assertEquals(13, classic.width());
        assertEquals(10, classic.height());
        assertEquals(layouts.getDefaultLayout(), classic.layout());
    }

    @Test
    void robotCrossesBoardSeamAndStopsAtTheActualMapEdge() {
        var board = GameBoard.training(new MapLayoutService().getDefaultLayout());
        var robot = new Robot("pilot", board.getSpawnPositions().getFirst(), Direction.EAST);

        robot.moveForward(board, 2);
        assertEquals(new Position(3, 1), robot.getPosition());

        assertEquals(Integer.valueOf(1), board.checkpointAt(new Position(10, 2)));

        robot.moveForward(board, 20);
        assertEquals(new Position(12, 1), robot.getPosition());
    }
}
