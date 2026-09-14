package com.example.demo.controller;

import com.example.demo.dto.CreateRoomRequest;
import com.example.demo.dto.RoomActionRequest;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import com.example.demo.dto.JoinRoomRequest;
import com.example.demo.dto.RoomResponse;
import com.example.demo.model.GameRoom;
import com.example.demo.service.RoomService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/games")
public class RoomController {
    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(@RequestBody CreateRoomRequest request) {
        GameRoom room = roomService.createRoom(request.playerName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(RoomResponse.forPlayer(room, room.hostPlayerId()));
    }

    @PostMapping("/join")
    public ResponseEntity<RoomResponse> joinRoom(@RequestBody JoinRoomRequest request) {
        GameRoom room = roomService.joinRoom(request.roomCode(), request.playerName());
        return ResponseEntity.ok(RoomResponse.forPlayer(room, room.players().getLast().playerId()));
    }
    @GetMapping("/{gameId}")
    public RoomResponse getRoom(@PathVariable UUID gameId, @RequestParam UUID playerId) {
        return RoomResponse.forPlayer(roomService.getRoom(gameId, playerId), playerId);
    }

    @PostMapping("/{gameId}/start")
    public RoomResponse startRoom(@PathVariable UUID gameId, @RequestBody RoomActionRequest request) {
        return RoomResponse.forPlayer(roomService.startRoom(gameId, request.playerId()), request.playerId());
    }

    @PostMapping("/{gameId}/leave")
    public ResponseEntity<Void> leaveRoom(@PathVariable UUID gameId, @RequestBody RoomActionRequest request) {
        roomService.leaveRoom(gameId, request.playerId());
        return ResponseEntity.noContent().build();
    }
}
