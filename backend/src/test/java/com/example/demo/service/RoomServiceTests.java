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
    private final String hostId = "host-123";
    private final String guestId = "guest-456";

    @Test
    void hostStartsAloneAndRepeatedStartIsSafe() {
        RoomService service = new RoomService();
        GameRoom room = service.createRoom("Host", hostId);
        assertEquals(com.example.demo.model.RoomStatus.STARTED,
                service.startRoom(room.gameId(), room.hostPlayerId()).status());
        assertEquals(com.example.demo.model.RoomStatus.STARTED,
                service.startRoom(room.gameId(), room.hostPlayerId()).status());
        var error = assertThrows(ResponseStatusException.class,
                () -> service.joinRoom(room.roomCode(), "Late guest", "late-id"));
        assertEquals(409, error.getStatusCode().value());
    }

    @Test
    void guestLeavesWithoutClosingRoomAndHostClosesIt() {
        RoomService service = new RoomService();
        GameRoom room = service.createRoom("Host", hostId);
        var joined = service.joinRoom(room.roomCode(), "Guest", guestId);

        assertEquals(2, service.getRoom(room.gameId(), room.hostPlayerId()).players().size());
        assertEquals(403, assertThrows(ResponseStatusException.class,
                () -> service.startRoom(room.gameId(), guestId)).getStatusCode().value());

        service.leaveRoom(room.gameId(), guestId);
        assertEquals(1, service.getRoom(room.gameId(), room.hostPlayerId()).players().size());
        assertEquals(403, assertThrows(ResponseStatusException.class,
                () -> service.getRoom(room.gameId(), guestId)).getStatusCode().value());

        service.startRoom(room.gameId(), room.hostPlayerId());
        service.leaveRoom(room.gameId(), room.hostPlayerId());
        assertEquals(404, assertThrows(ResponseStatusException.class,
                () -> service.getRoom(room.gameId(), room.hostPlayerId())).getStatusCode().value());
        assertEquals(404, assertThrows(ResponseStatusException.class,
                () -> service.joinRoom(room.roomCode(), "Guest", guestId)).getStatusCode().value());
    }

    @Test
    void unknownPlayersCannotReadStartOrLeave() {
        RoomService service = new RoomService();
        GameRoom room = service.createRoom("Host", hostId);
        String outsider = "outsider-id";

        assertEquals(403, assertThrows(ResponseStatusException.class,
                () -> service.getRoom(room.gameId(), outsider)).getStatusCode().value());
        assertEquals(403, assertThrows(ResponseStatusException.class,
                () -> service.startRoom(room.gameId(), outsider)).getStatusCode().value());
        assertEquals(403, assertThrows(ResponseStatusException.class,
                () -> service.leaveRoom(room.gameId(), outsider)).getStatusCode().value());
        assertEquals(com.example.demo.model.RoomStatus.WAITING,
                service.getRoom(room.gameId(), room.hostPlayerId()).status());
    }

    @Test
    void joinsExistingRoomWithNormalizedCodeAndPreservesHost() {
        RoomService service = new RoomService();
        GameRoom original = service.createRoom("Host", hostId);
        GameRoom joined = service.joinRoom(" " + original.roomCode().toLowerCase(java.util.Locale.ROOT) + " ",
                " Guest ", guestId);

        assertEquals(original.gameId(), joined.gameId());
        assertEquals(original.hostPlayerId(), joined.hostPlayerId());
        assertEquals(2, joined.players().size());
        assertEquals("Guest", joined.players().getLast().playerName());
        assertNotEquals(joined.hostPlayerId(), joined.players().getLast().playerId());
        assertEquals(1, original.players().size());

        // Use a different guest ID to ensure a 3rd player is added rather than
        // returning idempotently
        assertEquals(3, service.joinRoom(original.roomCode(), "Guest 2", "guest-789").players().size());
    }

    @Test
    void rejectsInvalidJoinInputAndUnknownRooms() {
        RoomService service = new RoomService();
        for (String code : new String[] { null, "", "  ", "ABC", "!!!!!!" }) {
            var error = assertThrows(ResponseStatusException.class, () -> service.joinRoom(code, "Guest", guestId));
            assertEquals(400, error.getStatusCode().value());
        }
        for (String name : new String[] { null, "", "  " }) {
            var error = assertThrows(ResponseStatusException.class, () -> service.joinRoom("ABC234", name, guestId));
            assertEquals(400, error.getStatusCode().value());
        }
        var missing = assertThrows(ResponseStatusException.class, () -> service.joinRoom("ABC234", "Guest", guestId));
        assertEquals(404, missing.getStatusCode().value());
    }

    @Test
    void concurrentJoinsAreRetainedAndOtherRoomsAreUnaffected() throws Exception {
        RoomService service = new RoomService();
        GameRoom room = service.createRoom("Host", hostId);
        GameRoom other = service.createRoom("Other host", "other-host-id");

        List<Callable<GameRoom>> tasks = IntStream.range(0, 30)
                .mapToObj(i -> (Callable<GameRoom>) () -> service.joinRoom(room.roomCode(), "Guest", "guest-" + i))
                .toList();

        try (var executor = Executors.newFixedThreadPool(8)) {
            var guestIds = new HashSet<String>();
            for (var result : executor.invokeAll(tasks)) {
                assertTrue(guestIds.add(result.get().players().getLast().playerId()));
            }
            GameRoom finalRoom = service.joinRoom(room.roomCode(), "Last guest", "last-guest");
            assertEquals(32, finalRoom.players().size());
            assertTrue(finalRoom.players().stream().map(p -> p.playerId()).toList().containsAll(guestIds));
            assertEquals(2, service.joinRoom(other.roomCode(), "Other guest", guestId).players().size());
        }
    }

    @Test
    void createsRoomWithItsHostAndTrimsName() {
        GameRoom room = new RoomService().createRoom("  Guest_1234  ", hostId);
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
        for (String name : new String[] { null, "", " \t\n " }) {
            var error = assertThrows(ResponseStatusException.class, () -> service.createRoom(name, hostId));
            assertEquals(400, error.getStatusCode().value());
        }
    }

    @Test
    void concurrentCreationsHaveDistinctCodesRoomsAndPlayers() throws Exception {
        RoomService service = new RoomService();
        List<Callable<GameRoom>> tasks = IntStream.range(0, 200)
                .mapToObj(i -> (Callable<GameRoom>) () -> service.createRoom("Guest", "host-" + i))
                .toList();

        try (var executor = Executors.newFixedThreadPool(8)) {
            var codes = new HashSet<String>();
            var gameIds = new HashSet<java.util.UUID>();
            var playerIds = new HashSet<String>();

            for (var result : executor.invokeAll(tasks)) {
                GameRoom room = result.get();
                assertTrue(codes.add(room.roomCode()));
                assertTrue(gameIds.add(room.gameId()));
                assertTrue(playerIds.add(room.hostPlayerId()));
            }
        }
    }
}