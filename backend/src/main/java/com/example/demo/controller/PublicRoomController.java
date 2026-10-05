package com.example.demo.controller;

import com.example.demo.dto.PublicRoomResponse;
import com.example.demo.service.RoomService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Read-only public-room discovery. This path is already permitted by the
 * existing security configuration, so pilots can see waiting rooms before
 * choosing one to join.
 */
@RestController
@RequestMapping("/api/public/rooms")
public class PublicRoomController {
    private final RoomService roomService;

    public PublicRoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    public List<PublicRoomResponse> listPublicRooms() {
        return roomService.listPublicRooms().stream().map(PublicRoomResponse::from).toList();
    }
}
