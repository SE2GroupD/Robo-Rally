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
    void joinsExistingRoomWithNormalizedCodeAndPreservesHost() {
        RoomService service = new RoomService();
        GameRoom original = service.createRoom("Host");
        GameRoom joined = service.joinRoom(" " + original.roomCode().toLowerCase(java.util.Locale.ROOT) + " ", " Guest ");
        assertEquals(original.gameId(), joined.gameId());
        assertEquals(original.hostPlayerId(), joined.hostPlayerId());
        assertEquals(2, joined.players().size());
        assertEquals("Guest", joined.players().getLast().playerName());
        assertNotEquals(joined.hostPlayerId(), joined.players().getLast().playerId());
        assertEquals(1, original.players().size());
        assertEquals(3, service.joinRoom(original.roomCode(), "Guest").players().size());
    }

    @Test
    void rejectsInvalidJoinInputAndUnknownRooms() {
        RoomService service = new RoomService();
        for (String code : new String[] {null, "", "  ", "ABC", "!!!!!!"}) {
            var error = assertThrows(ResponseStatusException.class, () -> service.joinRoom(code, "Guest"));
            assertEquals(400, error.getStatusCode().value());
        }
        for (String name : new String[] {null, "", "  "}) {
            var error = assertThrows(ResponseStatusException.class, () -> service.joinRoom("ABC234", name));
            assertEquals(400, error.getStatusCode().value());
        }
        var missing = assertThrows(ResponseStatusException.class, () -> service.joinRoom("ABC234", "Guest"));
        assertEquals(404, missing.getStatusCode().value());
    }

    @Test
    void concurrentJoinsAreRetainedAndOtherRoomsAreUnaffected() throws Exception {
        RoomService service = new RoomService();
        GameRoom room = service.createRoom("Host");
        GameRoom other = service.createRoom("Other host");
        List<Callable<GameRoom>> tasks = IntStream.range(0, 30)
                .mapToObj(i -> (Callable<GameRoom>) () -> service.joinRoom(room.roomCode(), "Guest"))
                .toList();
        try (var executor = Executors.newFixedThreadPool(8)) {
            var guestIds = new HashSet<java.util.UUID>();
            for (var result : executor.invokeAll(tasks)) {
                assertTrue(guestIds.add(result.get().players().getLast().playerId()));
            }
            GameRoom finalRoom = service.joinRoom(room.roomCode(), "Last guest");
            assertEquals(32, finalRoom.players().size());
            assertTrue(finalRoom.players().stream().map(p -> p.playerId()).toList().containsAll(guestIds));
            assertEquals(2, service.joinRoom(other.roomCode(), "Other guest").players().size());
        }
    }

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
