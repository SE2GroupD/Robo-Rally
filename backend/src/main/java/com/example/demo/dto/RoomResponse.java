package com.example.demo.dto;

import com.example.demo.model.GameRoom;
import com.example.demo.model.RoomPlayer;
import java.util.List;
import java.util.UUID;

public record RoomResponse(
        UUID gameId,
        String roomCode,
        String playerId,
        String hostPlayerId,
        String status,
        List<RoomPlayer> players) {

    public static RoomResponse forPlayer(GameRoom room, String securePlayerId) {
        return new RoomResponse(
                room.gameId(),
                room.roomCode(),
                securePlayerId,
                room.hostPlayerId(),
                room.status().name(),
                room.players());
    }
}