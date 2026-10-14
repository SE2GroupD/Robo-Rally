package com.example.demo.service;

import com.example.demo.model.GameRoom;
import com.example.demo.model.Position;
import com.example.demo.model.BoardDefinition;
import com.example.demo.model.Tile;
import com.example.demo.game.GameBoard;
import org.springframework.beans.factory.annotation.Autowired;
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

    private final MapLayoutService mapLayoutService;
    private final BoardRegistry boardRegistry;

    public RoomService() {
        this(new MapLayoutService());
    }

    public RoomService(MapLayoutService mapLayoutService) {
        this(mapLayoutService, loadedBoardRegistry());
    }

    public RoomService(BoardRegistry boardRegistry) {
        this(new MapLayoutService(), boardRegistry);
    }

    @Autowired
    public RoomService(MapLayoutService mapLayoutService, BoardRegistry boardRegistry) {
        this.mapLayoutService = mapLayoutService;
        this.boardRegistry = boardRegistry;
    }

    private static BoardRegistry loadedBoardRegistry() {
        var registry = new BoardRegistry();
        registry.loadBoards();
        return registry;
    }

    public GameBoard boardFor(GameRoom room) {
        if (room.mapId() != null) {
            return GameBoard.training(mapLayoutService.getLayout(room.mapId()));
        }
        if (room.startBoardId() != null) {
            var boards = new ArrayList<BoardDefinition>();
            boards.add(boardRegistry.getBoard(room.startBoardId()));
            for (String id : List.of("game1", "game2", "game3")) {
                var board = boardRegistry.getBoardById(id);
                if (board != null) boards.add(board);
            }
            return GameBoard.assemble(boards);
        }
        return room.training() ? GameBoard.training(mapLayoutService.getDefaultLayout()) : GameBoard.classicWithSeedTiles();
    }

    private List<Position> spawnPositions(GameRoom room) {
        return boardFor(room).getSpawnPositions();
    }

    public List<Tile> startTiles(GameRoom room) {
        var board = boardFor(room);
        var tiles = new HashMap<Position, Tile>();
        board.getSpecialTiles().forEach(tile -> tiles.put(new Position(tile.x(), tile.y()), tile));

        return board.getSpawnPositions().stream().map(position -> tiles.get(position).withOccupant(
                room.players().stream().filter(player -> position.equals(player.startPosition()))
                        .map(RoomPlayer::playerId).findFirst().orElse(null))).toList();
    }

    // Now accepts secure playerId from the controller/JWT
    public synchronized GameRoom createRoom(String playerName, String playerId) {
        return createRoom(playerName, playerId, false);
    }

    public synchronized GameRoom createRoom(String playerName, String playerId, boolean training) {
        return createRoom(playerName, playerId, training, null);
    }

    public synchronized GameRoom createRoom(String playerName, String playerId, String startBoardId) {
        return createRoom(playerName, playerId, false, startBoardId);
    }

    public synchronized GameRoom createRoom(String playerName, String playerId, boolean training, String startBoardId) {
        if (playerName == null || playerName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Player name is required.");
        }

        if (startBoardId != null && !startBoardId.isBlank()) {
            var board = boardRegistry.getBoardById(startBoardId);
            if (board == null || board.specialTiles().stream().noneMatch(Tile::isSpawnPoint)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown start board.");
            }
        } else {
            startBoardId = null;
        }

        String code;
        do {
            code = generateCode();
        } while (roomsByCode.containsKey(code));

        // Use the actual JWT subject instead of generating a random UUID
        RoomPlayer host = new RoomPlayer(playerId, playerName.strip(), null);
        GameRoom room = new GameRoom(UUID.randomUUID(), code, host.playerId(), List.of(host), RoomStatus.WAITING, training, startBoardId == null ? mapLayoutService.getDefaultLayout().id() : null, startBoardId);
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

        if (room.training()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Training rooms are solo only.");
        }

        if (room.status() != RoomStatus.WAITING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This room has already started.");
        }

        // Idempotent join: If the player is already in the room, just return it.
        if (room.players().stream().anyMatch(p -> p.playerId().equals(playerId))) {
            return room;
        }

        if (room.players().size() >= spawnPositions(room).size()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This room has no free start tiles.");
        }

        var players = new ArrayList<>(room.players());
        players.add(new RoomPlayer(playerId, playerName.strip(), null));
        GameRoom updated = new GameRoom(room.gameId(), code, room.hostPlayerId(), players, room.status(), room.training(), room.mapId(), room.startBoardId());
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
        if (room.status() == RoomStatus.STARTED) {
            return room;
        }

        var available = new ArrayList<>(spawnPositions(room));
        room.players().stream().map(RoomPlayer::startPosition).forEach(available::remove);

        var players = room.players().stream().map(player -> player.startPosition() != null ? player
                : new RoomPlayer(player.playerId(), player.playerName(), player.avatarId(), available.removeFirst()))
                .toList();

        GameRoom started = new GameRoom(room.gameId(), room.roomCode(), room.hostPlayerId(), players,
                RoomStatus.STARTED, room.training(), room.mapId(), room.startBoardId());
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
                    new GameRoom(room.gameId(), room.roomCode(), room.hostPlayerId(), remaining, room.status(), room.training(), room.mapId(), room.startBoardId()));
        }
    }


    public synchronized GameRoom selectRobot(UUID gameId, String playerId, int avatarId) {
        if (avatarId < 1 || avatarId > 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Avatar must be between 1 and 6.");
        }
        GameRoom room = getRoom(gameId, playerId);
        if (room.status() != RoomStatus.WAITING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Robot cannot be changed after the game has started.");
        }
        boolean avatarTaken = room.players().stream()
                .anyMatch(player -> player.avatarId() != null
                        && player.avatarId().equals(avatarId)
                        && !player.playerId().equals(playerId));
        if (avatarTaken) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This robot is already selected.");
        }
        var players = room.players().stream()
                .map(player -> player.playerId().equals(playerId)
                        ? new RoomPlayer(player.playerId(), player.playerName(), avatarId, player.startPosition())
                        : player)
                .toList();
        GameRoom updated = new GameRoom(room.gameId(), room.roomCode(), room.hostPlayerId(), players, room.status(), room.training(), room.mapId(), room.startBoardId());
        roomsByCode.put(room.roomCode(), updated);
        return updated;
    }

    /** Reservation and conflict checking share the same room lock, including game start. */
    public synchronized GameRoom selectStart(UUID gameId, String playerId, Position position, String mapId) {
        GameRoom room = getRoom(gameId, playerId);
        requireWaiting(room);

        if (mapId == null || !mapId.equals(room.mapId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The map changed. Refresh your start selection.");
        }

        return reserveStart(room, playerId, position);
    }

    /** Compatibility for the standalone start-board client; catalog rooms require a map ID. */
    public synchronized GameRoom selectStartTile(UUID gameId, String playerId, Position position) {
        var room = getRoom(gameId, playerId);
        requireWaiting(room);
        if (room.mapId() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Send the displayed map ID with the start selection.");
        }
        return reserveStart(room, playerId, position);
    }

    private GameRoom reserveStart(GameRoom room, String playerId, Position position) {
        if (position != null && !spawnPositions(room).contains(position)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a start tile on this map.");
        }

        if (position != null && room.players().stream().anyMatch(player ->
                !player.playerId().equals(playerId) && position.equals(player.startPosition()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This start tile is already selected.");
        }

        var players = room.players().stream().map(player -> player.playerId().equals(playerId)
                ? new RoomPlayer(player.playerId(), player.playerName(), player.avatarId(), position) : player).toList();

        GameRoom updated = new GameRoom(room.gameId(), room.roomCode(), room.hostPlayerId(), players,
                room.status(), room.training(), room.mapId(), room.startBoardId());
        roomsByCode.put(room.roomCode(), updated);
        return updated;
    }

    public synchronized GameRoom selectMap(UUID gameId, String playerId, String mapId) {
        GameRoom room = getRoom(gameId, playerId);
        requireWaiting(room);

        if (!room.hostPlayerId().equals(playerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the host can choose the map.");
        }

        var layout = mapLayoutService.getLayout(mapId);
        if (layout.id().equals(room.mapId())) {
            return room;
        }

        if (GameBoard.training(layout).getSpawnPositions().size() < room.players().size()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This map has too few start tiles.");
        }

        var players = room.players().stream().map(player ->
                new RoomPlayer(player.playerId(), player.playerName(), player.avatarId())).toList();
        GameRoom updated = new GameRoom(room.gameId(), room.roomCode(), room.hostPlayerId(), players,
                room.status(), room.training(), layout.id());
        roomsByCode.put(room.roomCode(), updated);
        return updated;
    }

    private void requireWaiting(GameRoom room) {
        if (room.status() != RoomStatus.WAITING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Setup cannot change after the game has started.");
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
}