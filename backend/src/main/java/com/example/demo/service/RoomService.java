package com.example.demo.service;

import com.example.demo.model.GameRoom;
import com.example.demo.model.RoomStatus;
import com.example.demo.model.RoomPlayer;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Locale;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class RoomService {
    // Active rooms are temporary: restarting the backend clears this map.
    private final Map<String, GameRoom> roomsByCode = new HashMap<>();
    private final SecureRandom random = new SecureRandom();
    private static final String CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    // Now accepts secure playerId from the controller/JWT
    public synchronized GameRoom createRoom(String playerName, String playerId) {
        if (playerName == null || playerName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Player name is required.");
        }

        String code;
        do {
            code = generateCode();
        } while (roomsByCode.containsKey(code));

        // Use the actual JWT subject instead of generating a random UUID
        RoomPlayer host = new RoomPlayer(playerId, playerName.strip());
        GameRoom room = new GameRoom(UUID.randomUUID(), code, host.playerId(), List.of(host), RoomStatus.WAITING);
        roomsByCode.put(code, room);
        return room;
    }

    // Now accepts secure playerId from the controller/JWT
    public synchronized GameRoom joinRoom(String roomCode, String playerName, String playerId) {
        if (playerName == null || playerName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Player name is required.");
        }
        if (roomCode == null || roomCode.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room code is required.");
        }
        String code = roomCode.strip().toUpperCase(Locale.ROOT);
        if (!code.matches("[A-HJ-NP-Z2-9]{6}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid room code format.");
        }
        GameRoom room = roomsByCode.get(code);
        if (room == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found.");
        }

        if (room.status() != RoomStatus.WAITING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This room has already started.");
        }

        // Idempotent join: If the player is already in the room, just return it.
        if (room.players().stream().anyMatch(p -> p.playerId().equals(playerId))) {
            return room;
        }

        var players = new ArrayList<>(room.players());
        players.add(new RoomPlayer(playerId, playerName.strip()));
        GameRoom updated = new GameRoom(room.gameId(), code, room.hostPlayerId(), players, room.status());
        roomsByCode.put(code, updated);
        return updated;
    }

    // Changed UUID to String for playerId
    public synchronized GameRoom getRoom(UUID gameId, String playerId) {
        GameRoom room = roomsByCode.values().stream()
                .filter(candidate -> candidate.gameId().equals(gameId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room closed or not found."));
        if (playerId == null || room.players().stream().noneMatch(player -> player.playerId().equals(playerId))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Player is not in this room.");
        }
        return room;
    }

    // Changed UUID to String for playerId
    public synchronized GameRoom startRoom(UUID gameId, String playerId) {
        GameRoom room = getRoom(gameId, playerId);
        if (!room.hostPlayerId().equals(playerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the host can start.");
        }
        GameRoom started = new GameRoom(room.gameId(), room.roomCode(), room.hostPlayerId(), room.players(),
                RoomStatus.STARTED);
        roomsByCode.put(room.roomCode(), started);
        return started;
    }

    // Changed UUID to String for playerId
    public synchronized void leaveRoom(UUID gameId, String playerId) {
        GameRoom room = getRoom(gameId, playerId);
        if (room.hostPlayerId().equals(playerId)) {
            roomsByCode.remove(room.roomCode());
        } else {
            var remaining = room.players().stream().filter(player -> !player.playerId().equals(playerId)).toList();
            roomsByCode.put(room.roomCode(),
                    new GameRoom(room.gameId(), room.roomCode(), room.hostPlayerId(), remaining, room.status()));
        }
    }

    private String generateCode() {
        StringBuilder code = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            code.append(CODE_CHARACTERS.charAt(random.nextInt(CODE_CHARACTERS.length())));
        }
        return code.toString();
    }
}