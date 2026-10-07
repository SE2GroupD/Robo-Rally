package com.example.demo.service;

import com.example.demo.model.GameRoom;
import org.junit.jupiter.api.BeforeEach;
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
    private BoardRegistry boardRegistry;
    private RoomService service;

    @BeforeEach
    void setUp() {
        boardRegistry = new BoardRegistry();
        boardRegistry.loadBoards();
        service = new RoomService(boardRegistry);
    }

    @Test
    void hostStartsAloneAndRepeatedStartIsSafe() {
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
        GameRoom original = service.createRoom("Host", hostId);
        GameRoom joined = service.joinRoom(" " + original.roomCode().toLowerCase(java.util.Locale.ROOT) + " ",
                " Guest ", guestId);

        assertEquals(original.gameId(), joined.gameId());
        assertEquals(original.hostPlayerId(), joined.hostPlayerId());
        assertEquals(2, joined.players().size());
        assertEquals("Guest", joined.players().getLast().playerName());
        assertNotEquals(joined.hostPlayerId(), joined.players().getLast().playerId());
        assertEquals(1, original.players().size());

        assertEquals(3, service.joinRoom(original.roomCode(), "Guest 2", "guest-789").players().size());
    }

    @Test
    void rejectsInvalidJoinInputAndUnknownRooms() {
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
        GameRoom room = service.createRoom("  Guest_1234  ", hostId);
        assertNotNull(room.gameId());
        assertTrue(room.roomCode().matches("[A-HJ-NP-Z2-9]{6}"));
        assertEquals(1, room.players().size());
        assertEquals(room.hostPlayerId(), room.players().getFirst().playerId());
        assertEquals("Guest_1234", room.players().getFirst().playerName());
        assertThrows(UnsupportedOperationException.class, () -> room.players().clear());
    }

    @Test
    void rejectsMissingBlankAndMalformedInput() {
        for (String name : new String[] { null, "", " \t\n " }) {
            var error = assertThrows(ResponseStatusException.class, () -> service.createRoom(name, hostId));
            assertEquals(400, error.getStatusCode().value());
        }
    }

    @Test
    void concurrentCreationsHaveDistinctCodesRoomsAndPlayers() throws Exception {
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

        @Test
    void selectStartTileAssignsValidSpawnPointSuccessfully() {
        GameRoom room = service.createRoom("Host", hostId);
        com.example.demo.model.Position validSpawn = new com.example.demo.model.Position(1, 1);

        GameRoom updated = service.selectStartTile(room.gameId(), hostId, validSpawn);

        assertEquals(validSpawn, updated.players().getFirst().startPosition());
    }

    @Test
    void selectStartTileRejectsTileAlreadyTakenByAnotherPlayer() {
        GameRoom room = service.createRoom("Host", hostId);
        service.joinRoom(room.roomCode(), "Guest", guestId);

        com.example.demo.model.Position sharedSpawn = new com.example.demo.model.Position(1, 1);
        service.selectStartTile(room.gameId(), hostId, sharedSpawn);

        // Le guest tente de choisir la même case
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> service.selectStartTile(room.gameId(), guestId, sharedSpawn));

        assertEquals(409, exception.getStatusCode().value(), "Expected 409 CONFLICT for already taken tile");
    }

    @Test
    void selectStartTileRejectsNonSpawnCoordinates() {
        GameRoom room = service.createRoom("Host", hostId);

        // Position (0, 0) est une case normale (pas un spawner)
        com.example.demo.model.Position invalidSpawn = new com.example.demo.model.Position(0, 0);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> service.selectStartTile(room.gameId(), hostId, invalidSpawn));

        assertEquals(400, exception.getStatusCode().value(), "Expected 400 BAD_REQUEST for invalid spawn position");
    }

    @Test
    void allowsPlayerToChangeTheirOwnSelection() {
        GameRoom room = service.createRoom("Host", hostId);
        com.example.demo.model.Position firstChoice = new com.example.demo.model.Position(1, 1);
        com.example.demo.model.Position secondChoice = new com.example.demo.model.Position(1, 2);

        service.selectStartTile(room.gameId(), hostId, firstChoice);
        GameRoom updated = service.selectStartTile(room.gameId(), hostId, secondChoice);

        assertEquals(secondChoice, updated.players().getFirst().startPosition());
    }
}