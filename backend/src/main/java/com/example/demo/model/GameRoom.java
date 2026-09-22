package com.example.demo.model;

import java.util.List;
import java.util.UUID;

public record GameRoom(UUID gameId, String roomCode, String hostPlayerId, List<RoomPlayer> players, RoomStatus status) {
    public GameRoom {
        players = List.copyOf(players);
    }
}
