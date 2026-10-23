package com.example.demo.controller;

import com.example.demo.dto.CreatePublicRoomRequest;
import com.example.demo.dto.CreateRoomRequest;
import com.example.demo.dto.RoomVisibilityRequest;
import com.example.demo.dto.JoinPublicRoomRequest;
import com.example.demo.dto.PublicRoomResponse;
import com.example.demo.dto.JoinRoomRequest;
import com.example.demo.dto.RoomResponse;
import com.example.demo.dto.SelectRobotRequest;
import com.example.demo.dto.SelectStartRequest;
import com.example.demo.dto.SelectMapRequest;
import com.example.demo.model.GameRoom;
import com.example.demo.service.GameService;
import com.example.demo.service.PublicRoomService;
import com.example.demo.service.RoomService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/games")
public class RoomController {
    private final RoomService roomService;
    private final PublicRoomService publicRoomService;
    private final GameService gameService;

    public RoomController(RoomService roomService, PublicRoomService publicRoomService, GameService gameService) {
        this.roomService = roomService;
        this.publicRoomService = publicRoomService;

        this.gameService = gameService;
    }

    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(
            @RequestBody CreateRoomRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        GameRoom room = roomService.createRoom(request.playerName(), jwt.getSubject(), Boolean.TRUE.equals(request.training()), request.startBoardId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(responseFor(room, room.hostPlayerId()));
    }

    @GetMapping("/public")
    public List<PublicRoomResponse> listPublicRooms() {
        return publicRoomService.listPublicRooms().stream().map(PublicRoomResponse::from).toList();
    }

    @PostMapping("/public")
    public ResponseEntity<RoomResponse> createPublicRoom(
            @RequestBody CreatePublicRoomRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        GameRoom room = publicRoomService.createPublicRoom(request.playerName(), jwt.getSubject(), request.roomName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(responseFor(room, room.hostPlayerId()));
    }

    @PostMapping("/public/{gameId}/join")
    public ResponseEntity<RoomResponse> joinPublicRoom(
            @PathVariable UUID gameId,
            @RequestBody JoinPublicRoomRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String playerId = jwt.getSubject();
        GameRoom room = publicRoomService.joinPublicRoom(gameId, request.playerName(), playerId);
        return ResponseEntity.ok(responseFor(room, playerId));
    }

    @PutMapping("/{gameId}/visibility")
    public RoomResponse setVisibility(
            @PathVariable UUID gameId,
            @RequestBody RoomVisibilityRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        if (request.publicRoom() == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "Room visibility is required.");
        }
        return responseFor(publicRoomService.setVisibility(gameId, jwt.getSubject(), request.publicRoom()), jwt.getSubject());
    }

    @PostMapping("/join")
    public ResponseEntity<RoomResponse> joinRoom(
            @RequestBody JoinRoomRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        String playerId = jwt.getSubject();
        GameRoom room = roomService.joinRoom(request.roomCode(), request.playerName(), playerId);
        return ResponseEntity.ok(responseFor(room, playerId));
    }

    @GetMapping("/{gameId}")
    public RoomResponse getRoom(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal Jwt jwt) {

        String securePlayerId = jwt.getSubject();
        return responseFor(roomService.getRoom(gameId, securePlayerId), securePlayerId);
    }

    /** The game session is created lazily from the room's players on first game request. */
    @PostMapping("/{gameId}/start")
    public RoomResponse startRoom(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal Jwt jwt) {

        String securePlayerId = jwt.getSubject();
        return responseFor(roomService.startRoom(gameId, securePlayerId), securePlayerId);
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

        return responseFor(room, playerId);
    }

    @PostMapping("/{gameId}/start-tile")
    public RoomResponse selectStart(
            @PathVariable UUID gameId,
            @RequestBody SelectStartRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        var room = request.mapId() == null
                ? roomService.selectStartTile(gameId, jwt.getSubject(), request.position())
                : roomService.selectStart(gameId, jwt.getSubject(), request.position(), request.mapId());
        return responseFor(room, jwt.getSubject());
    }

    @PostMapping("/{gameId}/map")
    public RoomResponse selectMap(
            @PathVariable UUID gameId,
            @RequestBody SelectMapRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        return responseFor(
                roomService.selectMap(gameId, jwt.getSubject(), request.mapId()), jwt.getSubject());
    }
    private RoomResponse responseFor(GameRoom room, String playerId) {
        return RoomResponse.forPlayer(room, playerId, roomService.startTiles(room), publicRoomService.isPublic(room.gameId()));
    }
}
