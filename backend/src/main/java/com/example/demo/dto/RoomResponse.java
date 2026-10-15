package com.example.demo.dto;

import com.example.demo.model.GameRoom;
import com.example.demo.model.RoomPlayer;
import com.example.demo.model.Tile;
import java.util.List;
import java.util.UUID;

public record RoomResponse(
        UUID gameId,
        String roomCode,
        String playerId,
        String hostPlayerId,
        String status,
        List<RoomPlayer> players,
        List<Tile> startBoardConfig) {

    public static RoomResponse forPlayer(GameRoom room, String securePlayerId, List<Tile> startBoardConfig) {
        return new RoomResponse(
                room.gameId(),
                room.roomCode(),
                securePlayerId,
                room.hostPlayerId(),
                room.status().name(),
                room.players(),
                startBoardConfig);
    }
}