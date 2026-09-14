package com.example.demo.service;

import com.example.demo.model.GameRoom;
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

    // Synchronization keeps code selection and insertion atomic across requests.
    public synchronized GameRoom createRoom(String playerName) {
        if (playerName == null || playerName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Player name is required.");
        }

        String code;
        do {
            code = generateCode();
        } while (roomsByCode.containsKey(code));

        RoomPlayer host = new RoomPlayer(UUID.randomUUID(), playerName.strip());
        GameRoom room = new GameRoom(UUID.randomUUID(), code, host.playerId(), List.of(host));
        roomsByCode.put(code, room);
        return room;
    }

    public synchronized GameRoom joinRoom(String roomCode, String playerName) {
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

        // Return an immutable snapshot containing this guest as the last player.
        // Holding the lock across lookup and replacement prevents lost joins.
        var players = new ArrayList<>(room.players());
        players.add(new RoomPlayer(UUID.randomUUID(), playerName.strip()));
        GameRoom updated = new GameRoom(room.gameId(), code, room.hostPlayerId(), players);
        roomsByCode.put(code, updated);
        return updated;
    }

    private String generateCode() {
        StringBuilder code = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            code.append(CODE_CHARACTERS.charAt(random.nextInt(CODE_CHARACTERS.length())));
        }
        return code.toString();
    }
}
