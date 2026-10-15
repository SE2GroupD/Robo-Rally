package com.example.demo.service;

import com.example.demo.model.Position;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.*;

class StartSelectionTests {

    @Test
    void reservationsAreExclusiveReleasedAndUsedInGameplay() throws Exception {
        var rooms = new RoomServiceImpl();
        var room = rooms.createRoom("Host", "host");
        rooms.joinRoom(room.roomCode(), "Guest", "guest");
        var position = new Position(1, 8);

        try (var executor = Executors.newFixedThreadPool(2)) {
            List<Callable<Boolean>> choices = List.of(
                    () -> reserve(rooms, room.gameId(), "host", position, room.mapId()),
                    () -> reserve(rooms, room.gameId(), "guest", position, room.mapId()));
            var results = executor.invokeAll(choices);
            assertNotEquals(results.get(0).get(), results.get(1).get());
        }

        rooms.selectStart(room.gameId(), "host", null, room.mapId());
        rooms.selectStart(room.gameId(), "guest", null, room.mapId());
        rooms.selectStart(room.gameId(), "guest", position, room.mapId());
        rooms.selectRobot(room.gameId(), "guest", 2);

        var started = rooms.startRoom(room.gameId(), "host");
        assertEquals(new Position(1, 1), started.players().getFirst().startPosition());
        assertEquals(position, started.players().getLast().startPosition());
        assertEquals(started, rooms.startRoom(room.gameId(), "host"));

        var state = new GameServiceImpl(rooms).getBoardState(room.gameId(), "guest");
        var guest = state.robots().stream().filter(robot -> robot.playerId().equals("guest")).findFirst().orElseThrow();
        assertEquals(position.x(), guest.x());
        assertEquals(position.y(), guest.y());

        assertStatus(409, () -> rooms.selectStart(room.gameId(), "guest", null, room.mapId()));
        assertStatus(409, () -> rooms.selectMap(room.gameId(), "host", room.mapId()));
    }

    @Test
    void validatesMembershipPositionsMapAndCapacity() {
        var rooms = new RoomServiceImpl();
        var room = rooms.createRoom("Host", "host");
        rooms.joinRoom(room.roomCode(), "Guest", "guest");

        assertStatus(403, () -> rooms.selectStart(room.gameId(), "outsider", new Position(1, 1), room.mapId()));
        assertStatus(400, () -> rooms.selectStart(room.gameId(), "host", new Position(0, 0), room.mapId()));
        assertStatus(409, () -> rooms.selectStart(room.gameId(), "host", new Position(1, 1), "stale-map"));
        assertStatus(403, () -> rooms.selectMap(room.gameId(), "guest", room.mapId()));
        assertStatus(404, () -> rooms.selectMap(room.gameId(), "host", "missing"));

        rooms.selectStart(room.gameId(), "guest", new Position(1, 1), room.mapId());
        assertEquals(new Position(1, 1), rooms.selectMap(room.gameId(), "host", room.mapId()).players().getLast().startPosition());
        rooms.leaveRoom(room.gameId(), "guest");
        rooms.selectStart(room.gameId(), "host", new Position(1, 1), room.mapId());

        for (int i = 0; i < 5; i++) rooms.joinRoom(room.roomCode(), "Player", "p" + i);
        assertStatus(409, () -> rooms.joinRoom(room.roomCode(), "Seventh", "extra"));
        var started = rooms.startRoom(room.gameId(), "host");
        assertEquals(6, started.players().stream().map(player -> player.startPosition()).distinct().count());
    }

    @Test
    void changingMapClearsReservationsAndChangesThePlayedLayout() {
        var original = new MapLayoutService().getDefaultLayout();
        var alternate = new com.example.demo.model.layout.MapLayout("test-map", "Test map", original.boards());
        var catalog = new MapLayoutService() {
            @Override
            public com.example.demo.model.layout.MapLayout getLayout(String id) {
                return "test-map".equals(id) ? alternate : super.getLayout(id);
            }
        };
        var rooms = new RoomServiceImpl(catalog);
        var room = rooms.createRoom("Host", "host");
        rooms.selectStart(room.gameId(), "host", new Position(1, 8), room.mapId());

        var changed = rooms.selectMap(room.gameId(), "host", "test-map");
        assertNull(changed.players().getFirst().startPosition());
        assertStatus(409, () -> rooms.selectStart(room.gameId(), "host", new Position(1, 1), room.mapId()));

        rooms.startRoom(room.gameId(), "host");
        assertEquals(alternate, new GameServiceImpl(rooms).getBoardState(room.gameId(), "host").layout());
    }

    private boolean reserve(RoomService rooms, java.util.UUID id, String player, Position position, String mapId) {
        try {
            rooms.selectStart(id, player, position, mapId);
            return true;
        } catch (ResponseStatusException conflict) {
            assertEquals(409, conflict.getStatusCode().value());
            return false;
        }
    }

    private void assertStatus(int expected, org.junit.jupiter.api.function.Executable action) {
        assertEquals(expected, assertThrows(ResponseStatusException.class, action).getStatusCode().value());
    }
}
