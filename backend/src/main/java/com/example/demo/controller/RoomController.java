package com.example.demo.controller;

import com.example.demo.dto.CreateRoomRequest;
import com.example.demo.dto.JoinRoomRequest;
import com.example.demo.dto.RoomResponse;
import com.example.demo.model.GameRoom;
import com.example.demo.service.RoomService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/games")
public class RoomController {
    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(
            @RequestBody CreateRoomRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        GameRoom room = roomService.createRoom(request.playerName(), jwt.getSubject());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(RoomResponse.forPlayer(room, room.hostPlayerId()));
    }

    @PostMapping("/join")
    public ResponseEntity<RoomResponse> joinRoom(
            @RequestBody JoinRoomRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        GameRoom room = roomService.joinRoom(request.roomCode(), request.playerName(), jwt.getSubject());
        return ResponseEntity.ok(RoomResponse.forPlayer(room, room.players().getLast().playerId()));
    }

    @GetMapping("/{gameId}")
    public RoomResponse getRoom(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal Jwt jwt) {

        String securePlayerId = jwt.getSubject();
        return RoomResponse.forPlayer(roomService.getRoom(gameId, securePlayerId), securePlayerId);
    }

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
        roomService.leaveRoom(gameId, securePlayerId);

        return ResponseEntity.noContent().build();
    }
}