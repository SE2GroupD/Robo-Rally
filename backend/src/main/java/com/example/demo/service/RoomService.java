package com.example.demo.service;

import com.example.demo.model.GameRoom;

import java.util.List;
import java.util.UUID;

/** Contract for creating, joining, and maintaining game rooms. */
public interface RoomService {
    record PublicRoom(GameRoom room, String roomName) { }

    GameRoom createRoom(String playerName, String playerId);

    GameRoom createPublicRoom(String playerName, String playerId, String roomName);

    List<PublicRoom> listPublicRooms();

    GameRoom joinPublicRoom(UUID gameId, String playerName, String playerId);

    GameRoom joinRoom(String roomCode, String playerName, String playerId);

    GameRoom getRoom(UUID gameId, String playerId);

    GameRoom startRoom(UUID gameId, String playerId);

    void leaveRoom(UUID gameId, String playerId);

    GameRoom selectRobot(UUID gameId, String playerId, int avatarId);

    GameRoom getRoomByGameId(UUID gameId);
}
