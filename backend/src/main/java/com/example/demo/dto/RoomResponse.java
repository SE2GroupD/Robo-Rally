package com.example.demo.dto;

import com.example.demo.model.GameRoom;
import com.example.demo.model.RoomPlayer;
import java.util.List;
import java.util.UUID;

public record RoomResponse(
        UUID gameId,
        String roomCode,
        UUID playerId,
        UUID hostPlayerId,
        String status,
        List<RoomPlayer> players) {

    public static RoomResponse forPlayer(GameRoom room, UUID playerId) {
        return new RoomResponse(
                room.gameId(), room.roomCode(), playerId,
                room.hostPlayerId(), "WAITING", room.players());
    }
}
