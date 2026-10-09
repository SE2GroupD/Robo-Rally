package com.example.demo.controller;

import com.example.demo.dto.CreatePublicRoomRequest;
import com.example.demo.dto.CreateRoomRequest;
import com.example.demo.dto.JoinPublicRoomRequest;
import com.example.demo.dto.JoinRoomRequest;
import com.example.demo.dto.PublicRoomResponse;
import com.example.demo.dto.RoomResponse;
import com.example.demo.dto.SelectRobotRequest;
import com.example.demo.model.GameRoom;
import com.example.demo.service.GameService;
import com.example.demo.service.RoomService;
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
    private final GameService gameService;

    public RoomController(RoomService roomService, GameService gameService) {
        this.roomService = roomService;
        this.gameService = gameService;
    }

    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(
            @RequestBody CreateRoomRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        GameRoom room = roomService.createRoom(request.playerName(), jwt.getSubject());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(RoomResponse.forPlayer(room, room.hostPlayerId()));
    }

    @GetMapping("/public")
    public List<PublicRoomResponse> listPublicRooms() {
        return roomService.listPublicRooms().stream().map(PublicRoomResponse::from).toList();
    }

    @PostMapping("/public")
    public ResponseEntity<RoomResponse> createPublicRoom(
            @RequestBody CreatePublicRoomRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        GameRoom room = roomService.createPublicRoom(request.playerName(), jwt.getSubject(), request.roomName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(RoomResponse.forPlayer(room, room.hostPlayerId()));
    }

    @PostMapping("/public/{gameId}/join")
    public ResponseEntity<RoomResponse> joinPublicRoom(
            @PathVariable UUID gameId,
            @RequestBody JoinPublicRoomRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        String playerId = jwt.getSubject();
        GameRoom room = roomService.joinPublicRoom(gameId, request.playerName(), playerId);
        return ResponseEntity.ok(RoomResponse.forPlayer(room, playerId));
    }

    @PostMapping("/join")
    public ResponseEntity<RoomResponse> joinRoom(
            @RequestBody JoinRoomRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        String playerId = jwt.getSubject();
        GameRoom room = roomService.joinRoom(request.roomCode(), request.playerName(), playerId);
        return ResponseEntity.ok(RoomResponse.forPlayer(room, playerId));
    }

    @GetMapping("/{gameId}")
    public RoomResponse getRoom(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal Jwt jwt) {

        String securePlayerId = jwt.getSubject();
        return RoomResponse.forPlayer(roomService.getRoom(gameId, securePlayerId), securePlayerId);
    }

    /** The game session is created lazily from the room's players on first game request. */
    @PostMapping("/{gameId}/start")
    public RoomResponse startRoom(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal Jwt jwt) {

        String securePlayerId = jwt.getSubject();
        return RoomResponse.forPlayer(roomService.startRoom(gameId, securePlayerId), securePlayerId);
    }

    @PostMapping("/{gameId}/leave")
    public ResponseEntity<Void> leaveRoom(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal Jwt jwt) {

        String securePlayerId = jwt.getSubject();
        GameRoom room = roomService.getRoom(gameId, securePlayerId);
        boolean wasHost = room.hostPlayerId().equals(securePlayerId);
        roomService.leaveRoom(gameId, securePlayerId);

        if (wasHost) {
            gameService.endGame(gameId);
        } else {
            gameService.removePlayer(gameId, securePlayerId);
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{gameId}/robot")
    public RoomResponse selectRobot(
            @PathVariable UUID gameId,
            @RequestBody SelectRobotRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        String playerId = jwt.getSubject();
        GameRoom room = roomService.selectRobot(gameId, playerId, request.avatarId());

        return RoomResponse.forPlayer(room, playerId);
    }
}