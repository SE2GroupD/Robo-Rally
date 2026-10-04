package com.example.demo.controller;

import com.example.demo.dto.CreateRoomRequest;
import com.example.demo.dto.JoinRoomRequest;
import com.example.demo.dto.RoomResponse;
import com.example.demo.model.GameRoom;
import com.example.demo.service.RoomService;
import com.example.demo.model.Position;
import com.example.demo.game.GameBoard;
import com.example.demo.model.Tile;
import com.example.demo.service.BoardRegistry;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/games")
public class RoomController {
    private final RoomService roomService;
    private final BoardRegistry boardRegistry;

    public RoomController(RoomService roomService, BoardRegistry boardRegistry) {
        this.roomService = roomService;
        this.boardRegistry = boardRegistry;
    }

    private List<Tile> getSpawnsForRoom(GameRoom room) {
        return boardRegistry.getBoard(room.startBoardId()).specialTiles().stream()
                .filter(Tile::isSpawnPoint)
                .toList();
    }

    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(
            @RequestBody CreateRoomRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        GameRoom room = roomService.createRoom(request.playerName(), jwt.getSubject(), request.startBoardId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(RoomResponse.forPlayer(room, room.hostPlayerId(), getSpawnsForRoom(room)));
    }

    @PostMapping("/join")
    public ResponseEntity<RoomResponse> joinRoom(
            @RequestBody JoinRoomRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        GameRoom room = roomService.joinRoom(request.roomCode(), request.playerName(), jwt.getSubject());
        return ResponseEntity.ok(RoomResponse.forPlayer(room, room.players().getLast().playerId(), getSpawnsForRoom(room)));
    }

    @GetMapping("/{gameId}")
    public RoomResponse getRoom(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal Jwt jwt) {

        String securePlayerId = jwt.getSubject();
        GameRoom room = roomService.getRoom(gameId, securePlayerId);
        return RoomResponse.forPlayer(room, securePlayerId, getSpawnsForRoom(room));
    }

    @PostMapping("/{gameId}/start")
    public RoomResponse startRoom(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal Jwt jwt) {

        String securePlayerId = jwt.getSubject();
        GameRoom room = roomService.startRoom(gameId, securePlayerId);
        return RoomResponse.forPlayer(room, securePlayerId, getSpawnsForRoom(room));
    }

    @PostMapping("/{gameId}/leave")
    public ResponseEntity<Void> leaveRoom(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal Jwt jwt) {

        String securePlayerId = jwt.getSubject();
        roomService.leaveRoom(gameId, securePlayerId);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{gameId}/start-tile")
    public ResponseEntity<RoomResponse> selectStartTile(
            @PathVariable UUID gameId,
            @RequestBody Position position,
            @AuthenticationPrincipal Jwt jwt) {

        String securePlayerId = jwt.getSubject();
        GameRoom updatedRoom = roomService.selectStartTile(gameId, securePlayerId, position);
        return ResponseEntity.ok(RoomResponse.forPlayer(updatedRoom, securePlayerId, getSpawnsForRoom(updatedRoom)));
    }
}