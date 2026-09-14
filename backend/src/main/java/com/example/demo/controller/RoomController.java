package com.example.demo.controller;

import com.example.demo.dto.CreateRoomRequest;
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
}
