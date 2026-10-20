package com.example.demo.dto;

import com.example.demo.service.PublicRoomService;

import java.util.UUID;

public record PublicRoomResponse(
        UUID gameId,
        String roomName,
        String hostPlayerName,
        int playerCount,
        int maxPlayers) {
    public static PublicRoomResponse from(PublicRoomService.PublicRoom publicRoom) {
        var room = publicRoom.room();
        String hostName = room.players().stream()
                .filter(player -> player.playerId().equals(room.hostPlayerId()))
                .map(player -> player.playerName())
                .findFirst()
                .orElse("Unknown host");
        return new PublicRoomResponse(room.gameId(), publicRoom.roomName(), hostName, room.players().size(), 6);
    }
}
