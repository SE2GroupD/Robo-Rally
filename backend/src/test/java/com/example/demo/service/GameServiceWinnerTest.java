package com.example.demo.service;

import com.example.demo.dto.ProgramRegisterDto;
import com.example.demo.game.GameBoard;
import com.example.demo.game.GameSession;
import com.example.demo.model.CardType;
import com.example.demo.model.Conveyor;
import com.example.demo.model.Direction;
import com.example.demo.model.GameRoom;
import com.example.demo.model.GearRotation;
import com.example.demo.model.Position;
import com.example.demo.model.ResolutionPhase;
import com.example.demo.model.RoomPlayer;
import com.example.demo.model.RoomStatus;
import com.example.demo.model.Tile;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GameServiceWinnerTest {

    private final UUID gameId = UUID.randomUUID();
    private final String playerId = "pilot";
    private final ProgramRegisterDto program = new ProgramRegisterDto(List.of(
            CardType.POWER_UP, CardType.MOVE_1, CardType.MOVE_1, CardType.MOVE_1, CardType.MOVE_1));

    private GameServiceImpl gameOn(GameBoard board) {
        RoomService rooms = mock(RoomService.class);
        GameRoom room = new GameRoom(gameId, "ABC234", playerId,
                List.of(new RoomPlayer(playerId, "Pilot", 3)), RoomStatus.STARTED);
        when(rooms.getRoom(gameId, playerId)).thenReturn(room);
        GameSession session = new GameSession(board);
        session.addPlayer(playerId, new Position(0, 0), Direction.EAST);
        session.getDeck(playerId).getCurrentHand().addAll(program.registers());
        GameServiceImpl games = new GameServiceImpl(rooms);
        ReflectionTestUtils.setField(games, "sessions", new ConcurrentHashMap<>(Map.of(gameId, session)));
        return games;
    }

    @Test
    void finalCheckpointIsClaimedAfterGearsAndStopsLaterRegistersAndProgramming() {
        Tile checkpoint = new Tile(0, 0, false, null, false, false,
                GearRotation.CLOCKWISE, null, 1, null);
        GameServiceImpl games = gameOn(new GameBoard(5, 1, List.of(checkpoint), List.of()));

        games.submitPlayerRegisters(gameId, playerId, program);

        var state = games.getBoardState(gameId, playerId);
        assertEquals(playerId, state.winner().playerId());
        assertEquals(List.of(1), state.checkpointProgress().getFirst().completedCheckpoints());
        assertEquals(Direction.SOUTH, state.robots().getFirst().direction());
        assertEquals(1, state.lastResolution().steps().size());
        assertEquals(ResolutionPhase.GEAR, state.lastResolution().steps().getFirst().phases().getLast().phase());
        assertThrows(IllegalStateException.class, () -> games.getPlayerHand(gameId, playerId));
        assertThrows(IllegalStateException.class, () -> games.submitPlayerRegisters(gameId, playerId, program));
        assertEquals(state, games.getBoardState(gameId, playerId));
    }

    @Test
    void conveyorMovingRobotOffCheckpointPreventsPrematureWin() {
        Tile checkpoint = new Tile(0, 0, false, null, false, false,
                null, new Conveyor(Direction.EAST), 1, null);
        GameServiceImpl games = gameOn(new GameBoard(6, 1, List.of(checkpoint), List.of()));

        games.submitPlayerRegisters(gameId, playerId, program);

        var state = games.getBoardState(gameId, playerId);
        assertNull(state.winner());
        assertEquals(List.of(), state.checkpointProgress().getFirst().completedCheckpoints());
        assertEquals(5, state.lastResolution().steps().size());
        assertEquals(5, state.robots().getFirst().x());
    }

    @Test
    void conveyorCanCarryRobotOntoFinalCheckpoint() {
        GameServiceImpl games = gameOn(new GameBoard(6, 1, List.of(
                Tile.conveyorTile(0, 0, new Conveyor(Direction.EAST)),
                Tile.checkpoint(1, 0, 1)), List.of()));

        games.submitPlayerRegisters(gameId, playerId, program);

        var state = games.getBoardState(gameId, playerId);
        assertEquals(playerId, state.winner().playerId());
        assertEquals(1, state.robots().getFirst().x());
        assertEquals(1, state.lastResolution().steps().size());
        assertEquals(ResolutionPhase.BELT, state.lastResolution().steps().getFirst().phases().getLast().phase());
    }
}
