package com.example.demo.service;

import com.example.demo.game.GameBoard;
import com.example.demo.model.GameRoom;
import com.example.demo.model.Position;
import com.example.demo.model.Tile;

import java.util.List;
import java.util.UUID;

/** Contract shared by private rooms, public rooms and gameplay. */
public interface RoomService {
    GameBoard boardFor(GameRoom room);

    List<Tile> startTiles(GameRoom room);

    GameRoom createRoom(String playerName, String playerId);

    GameRoom createRoom(String playerName, String playerId, boolean training);

    GameRoom createRoom(String playerName, String playerId, String startBoardId);

    GameRoom createRoom(String playerName, String playerId, boolean training, String startBoardId);

    GameRoom joinRoom(String roomCode, String playerName, String playerId);

    GameRoom getRoom(UUID gameId, String playerId);

    GameRoom startRoom(UUID gameId, String playerId);

    void leaveRoom(UUID gameId, String playerId);

    GameRoom selectRobot(UUID gameId, String playerId, int avatarId);

    GameRoom selectStart(UUID gameId, String playerId, Position position, String mapId);

    GameRoom selectStartTile(UUID gameId, String playerId, Position position);

    GameRoom selectMap(UUID gameId, String playerId, String mapId);

    GameRoom getRoomByGameId(UUID gameId);
}
