package com.example.demo.service;

import com.example.demo.game.GameBoard;
import com.example.demo.model.Position;
import com.example.demo.model.Tile;
import com.example.demo.model.GameRoom;
import com.example.demo.model.RoomStatus;
import com.example.demo.model.RoomPlayer;
import com.example.demo.model.BoardDefinition;
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
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class RoomService {
    // Active rooms are temporary: restarting the backend clears this map.
    private final Map<String, GameRoom> roomsByCode = new HashMap<>();
    private final SecureRandom random = new SecureRandom();
    private static final String CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private final BoardRegistry boardRegistry;

    public RoomService(BoardRegistry boardRegistry) {
        this.boardRegistry = boardRegistry;
    }

    // Now accepts secure playerId from the controller/JWT
    public synchronized GameRoom createRoom(String playerName, String playerId, String requestedBoardId) {
        if (playerName == null || playerName.isBlank()) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Player name is required.");
        }
        String code;
        do {
            code = generateCode();
        } while (roomsByCode.containsKey(code));
        String boardId = (requestedBoardId != null && !requestedBoardId.isBlank()) ? requestedBoardId : "classic_start";
        RoomPlayer host = new RoomPlayer(playerId, playerName.strip(), null);
        GameRoom room = new GameRoom(UUID.randomUUID(), code, host.playerId(), List.of(host), RoomStatus.WAITING, boardId);
        roomsByCode.put(code, room);
        return room;
    }

    public synchronized GameRoom createRoom(String playerName, String playerId) {
        return createRoom(playerName, playerId, "classic_start");
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
        players.add(new RoomPlayer(playerId, playerName.strip(), null));
        GameRoom updated = new GameRoom(room.gameId(), code, room.hostPlayerId(), players, room.status(), room.startBoardId());
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

        BoardDefinition board = boardRegistry.getBoard(room.startBoardId());
        List<Position> availableSpawns = board.specialTiles().stream()
                .filter(Tile::isSpawnPoint)
                .map(t -> new Position(t.x(), t.y()))
                .collect(Collectors.toList());

        room.players().stream()
                .map(RoomPlayer::startPosition)
                .filter(Objects::nonNull)
                .forEach(availableSpawns::remove);

        List<RoomPlayer> updatedPlayers = new ArrayList<>();
        for (RoomPlayer player : room.players()) {
            if (player.startPosition() == null) {
                if (availableSpawns.isEmpty()) {
                    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Not enough spawn points available.");
                }
                Position assignedPos = availableSpawns.removeFirst();
                updatedPlayers.add(player.withStartPosition(assignedPos));
            } else {
                updatedPlayers.add(player);
            }
        }

        GameRoom started = new GameRoom(room.gameId(), room.roomCode(), room.hostPlayerId(), updatedPlayers, RoomStatus.STARTED, room.startBoardId());
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
            roomsByCode.put(room.roomCode(), new GameRoom(room.gameId(), room.roomCode(), room.hostPlayerId(), remaining, room.status(), room.startBoardId()));
        }
    }

    public synchronized GameRoom getRoomByGameId(UUID gameId) {
        return roomsByCode.values().stream()
                .filter(candidate -> candidate.gameId().equals(gameId))
                .findFirst()
                .orElse(null);
    }

    private String generateCode() {
        StringBuilder code = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            code.append(CODE_CHARACTERS.charAt(random.nextInt(CODE_CHARACTERS.length())));
        }
        return code.toString();
    }

    public synchronized GameRoom selectStartTile(UUID gameId, String playerId, Position position) {
        GameRoom room = getRoom(gameId, playerId);
        
        if (room.status() != RoomStatus.WAITING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot select tile after game has started.");
        }

        BoardDefinition board = boardRegistry.getBoard(room.startBoardId());
        boolean isValidSpawn = board.specialTiles().stream()
                .anyMatch(t -> t.isSpawnPoint() && t.x() == position.x() && t.y() == position.y());
        
        if (!isValidSpawn) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid spawn position.");
        }

        boolean alreadyTaken = room.players().stream()
                .anyMatch(p -> !p.playerId().equals(playerId) && position.equals(p.startPosition()));
        
        if (alreadyTaken) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tile already selected.");
        }

        List<RoomPlayer> updatedPlayers = room.players().stream()
                .map(p -> p.playerId().equals(playerId) ? p.withStartPosition(position) : p)
                .toList();

        GameRoom updatedRoom = new GameRoom(room.gameId(), room.roomCode(), room.hostPlayerId(), updatedPlayers, room.status(), room.startBoardId());
        roomsByCode.put(room.roomCode(), updatedRoom);
        return updatedRoom;
    }
}