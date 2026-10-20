package com.example.demo.service;

import com.example.demo.model.GameRoom;
import com.example.demo.model.RoomStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PublicRoomServiceImpl implements PublicRoomService {
    private static final int MAX_PUBLIC_ROOM_PLAYERS = 6;

    private final RoomService roomService;
    private final Map<UUID, String> roomNamesByGameId = new HashMap<>();

    public PublicRoomServiceImpl(RoomService roomService) {
        this.roomService = roomService;
    }

    @Override
    public synchronized GameRoom createPublicRoom(String playerName, String playerId, String roomName) {
        if (roomName == null || roomName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room name is required.");
        }
        String cleanRoomName = roomName.strip();
        if (cleanRoomName.length() > 40) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room name must be 40 characters or fewer.");
        }

        GameRoom room = roomService.createRoom(playerName, playerId);
        roomNamesByGameId.put(room.gameId(), cleanRoomName);
        return room;
    }

    @Override
    public synchronized List<PublicRoom> listPublicRooms() {
        List<PublicRoom> publicRooms = new ArrayList<>();
        for (Map.Entry<UUID, String> entry : roomNamesByGameId.entrySet()) {
            GameRoom room = roomService.getRoomByGameId(entry.getKey());
            if (room != null && room.status() == RoomStatus.WAITING && room.players().size() < MAX_PUBLIC_ROOM_PLAYERS) {
                publicRooms.add(new PublicRoom(room, entry.getValue()));
            }
        }
        publicRooms.sort(Comparator.comparing(PublicRoom::roomName, String.CASE_INSENSITIVE_ORDER)
                .thenComparing(publicRoom -> publicRoom.room().roomCode()));
        return List.copyOf(publicRooms);
    }

    @Override
    public synchronized GameRoom joinPublicRoom(UUID gameId, String playerName, String playerId) {
        if (!roomNamesByGameId.containsKey(gameId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Public room not found.");
        }
        GameRoom room = roomService.getRoomByGameId(gameId);
        if (room == null) {
            roomNamesByGameId.remove(gameId);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Public room not found.");
        }
        boolean alreadyJoined = room.players().stream().anyMatch(player -> player.playerId().equals(playerId));
        if (!alreadyJoined && room.players().size() >= MAX_PUBLIC_ROOM_PLAYERS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This room is full.");
        }
        return roomService.joinRoom(room.roomCode(), playerName, playerId);
    }
}
