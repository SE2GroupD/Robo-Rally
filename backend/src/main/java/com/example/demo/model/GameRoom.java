package com.example.demo.model;

import java.util.List;
import java.util.UUID;

public record GameRoom(UUID gameId, String roomCode, String hostPlayerId, List<RoomPlayer> players, RoomStatus status, boolean training, String mapId, String startBoardId) {
    public GameRoom(UUID gameId, String roomCode, String hostPlayerId, List<RoomPlayer> players, RoomStatus status, boolean training, String mapId) {
        this(gameId, roomCode, hostPlayerId, players, status, training, mapId, null);
    }

    public GameRoom(UUID gameId, String roomCode, String hostPlayerId, List<RoomPlayer> players, RoomStatus status, boolean training) {
        this(gameId, roomCode, hostPlayerId, players, status, training, null);
    }

    public GameRoom(UUID gameId, String roomCode, String hostPlayerId, List<RoomPlayer> players, RoomStatus status) {
        this(gameId, roomCode, hostPlayerId, players, status, false);
    }

    public GameRoom {
        players = List.copyOf(players);
    }
}
