package com.example.demo.controller;

import com.example.demo.dto.CreatePublicRoomRequest;
import com.example.demo.dto.CreateRoomRequest;
import com.example.demo.dto.JoinPublicRoomRequest;
import com.example.demo.dto.PublicRoomResponse;
import com.example.demo.dto.JoinRoomRequest;
import com.example.demo.dto.RoomResponse;
import com.example.demo.dto.SelectRobotRequest;
import com.example.demo.model.GameRoom;
import com.example.demo.model.Position;
import com.example.demo.model.Tile;
import com.example.demo.service.BoardRegistry;
import com.example.demo.service.GameService;
import com.example.demo.service.PublicRoomService;
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
    private final BoardRegistry boardRegistry;
    private final PublicRoomService publicRoomService;
    private final GameService gameService;

    public RoomController(
            RoomService roomService,
            BoardRegistry boardRegistry,
            PublicRoomService publicRoomService,
            GameService gameService) {
        this.roomService = roomService;
        this.boardRegistry = boardRegistry;
        this.publicRoomService = publicRoomService;
        this.gameService = gameService;
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
                .body(RoomResponse.forPlayer(room, room.hostPlayerId(), getSpawnsForRoom(room)));
    }

    @PostMapping("/public/{gameId}/join")
    public ResponseEntity<RoomResponse> joinPublicRoom(
            @PathVariable UUID gameId,
            @RequestBody JoinPublicRoomRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String playerId = jwt.getSubject();
        GameRoom room = publicRoomService.joinPublicRoom(gameId, request.playerName(), playerId);
        return ResponseEntity.ok(RoomResponse.forPlayer(room, playerId, getSpawnsForRoom(room)));
    }

    @PostMapping("/join")
    public ResponseEntity<RoomResponse> joinRoom(
            @RequestBody JoinRoomRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        String playerId = jwt.getSubject();
        GameRoom room = roomService.joinRoom(request.roomCode(), request.playerName(), playerId);
        return ResponseEntity.ok(RoomResponse.forPlayer(room, playerId, getSpawnsForRoom(room)));
    }

    @GetMapping("/{gameId}")
    public RoomResponse getRoom(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal Jwt jwt) {

        String securePlayerId = jwt.getSubject();
        GameRoom room = roomService.getRoom(gameId, securePlayerId);
        return RoomResponse.forPlayer(room, securePlayerId, getSpawnsForRoom(room));
    }

    /** The game session is created lazily from the room's players on first game request. */
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

    @PostMapping("/{gameId}/start-tile")
    public ResponseEntity<RoomResponse> selectStartTile(
            @PathVariable UUID gameId,
            @RequestBody Position position,
            @AuthenticationPrincipal Jwt jwt) {

        String securePlayerId = jwt.getSubject();
        GameRoom updatedRoom = roomService.selectStartTile(gameId, securePlayerId, position);
        return ResponseEntity.ok(RoomResponse.forPlayer(updatedRoom, securePlayerId, getSpawnsForRoom(updatedRoom)));
    }

    @PostMapping("/{gameId}/robot")
    public RoomResponse selectRobot(
            @PathVariable UUID gameId,
            @RequestBody SelectRobotRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        String playerId = jwt.getSubject();
        GameRoom room = roomService.selectRobot(gameId, playerId, request.avatarId());

        return RoomResponse.forPlayer(room, playerId, getSpawnsForRoom(room));
    }

}
