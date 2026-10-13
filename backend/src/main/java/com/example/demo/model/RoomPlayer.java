package com.example.demo.model;

public record RoomPlayer(String playerId, String playerName, Position startPosition, Integer avatarId) {

    public RoomPlayer withStartPosition(Position position) {
        return new RoomPlayer(this.playerId, this.playerName, position, this.avatarId);
    }
}