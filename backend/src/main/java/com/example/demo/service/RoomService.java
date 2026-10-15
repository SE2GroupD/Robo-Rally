package com.example.demo.service;

import com.example.demo.model.GameRoom;
import com.example.demo.model.Position;

import java.util.UUID;

/** Contract for creating, joining, and maintaining game rooms. */
public interface RoomService {
    GameRoom createRoom(String playerName, String playerId, String requestedBoardId);

    GameRoom joinRoom(String roomCode, String playerName, String playerId);

    GameRoom getRoom(UUID gameId, String playerId);

    GameRoom startRoom(UUID gameId, String playerId);

    void leaveRoom(UUID gameId, String playerId);

    GameRoom selectRobot(UUID gameId, String playerId, int avatarId);

    GameRoom selectStartTile(UUID gameId, String playerId, Position position);

    GameRoom getRoomByGameId(UUID gameId);
}
