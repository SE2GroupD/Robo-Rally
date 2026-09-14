package com.example.demo.model;

import java.util.List;
import java.util.UUID;

public record GameRoom(UUID gameId, String roomCode, UUID hostPlayerId, List<RoomPlayer> players) {
    public GameRoom {
        players = List.copyOf(players);
    }
}
