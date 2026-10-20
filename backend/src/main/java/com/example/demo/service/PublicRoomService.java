package com.example.demo.service;

import com.example.demo.model.GameRoom;

import java.util.List;
import java.util.UUID;

/** Operations used by the Start Platform to publish and join public rooms. */
public interface PublicRoomService {
    record PublicRoom(GameRoom room, String roomName) { }

    GameRoom createPublicRoom(String playerName, String playerId, String roomName);

    List<PublicRoom> listPublicRooms();

    GameRoom joinPublicRoom(UUID gameId, String playerName, String playerId);
}
