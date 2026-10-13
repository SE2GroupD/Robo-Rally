package com.example.demo.model;

public record RoomPlayer(String playerId, String playerName, Integer avatarId, Position startPosition) {

    public RoomPlayer(String playerId, String playerName, Integer avatarId) {
        this(playerId, playerName, avatarId, null);
    }
}
