package com.example.demo.service;

import com.example.demo.model.GameRoom;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;

class RoomServiceTests {
    @Test
    void createsRoomWithItsHostAndTrimsName() {
        GameRoom room = new RoomService().createRoom("  Guest_1234  ");
        assertNotNull(room.gameId());
        assertTrue(room.roomCode().matches("[A-HJ-NP-Z2-9]{6}"));
        assertEquals(1, room.players().size());
        assertEquals(room.hostPlayerId(), room.players().getFirst().playerId());
        assertEquals("Guest_1234", room.players().getFirst().playerName());
        assertThrows(UnsupportedOperationException.class, () -> room.players().clear());
    }

    @Test
    void rejectsMissingOrBlankNames() {
        RoomService service = new RoomService();
        for (String name : new String[] {null, "", " \t\n "}) {
            var error = assertThrows(ResponseStatusException.class, () -> service.createRoom(name));
            assertEquals(400, error.getStatusCode().value());
        }
    }

    @Test
    void concurrentCreationsHaveDistinctCodesRoomsAndPlayers() throws Exception {
        RoomService service = new RoomService();
        List<Callable<GameRoom>> tasks = IntStream.range(0, 200)
                .mapToObj(i -> (Callable<GameRoom>) () -> service.createRoom("Guest"))
                .toList();
        try (var executor = Executors.newFixedThreadPool(8)) {
            var codes = new HashSet<String>();
            var gameIds = new HashSet<java.util.UUID>();
            var playerIds = new HashSet<java.util.UUID>();
            for (var result : executor.invokeAll(tasks)) {
                GameRoom room = result.get();
                assertTrue(codes.add(room.roomCode()));
                assertTrue(gameIds.add(room.gameId()));
                assertTrue(playerIds.add(room.hostPlayerId()));
            }
        }
    }
}
