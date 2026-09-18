package com.example.demo.controller;

import com.example.demo.dto.BoardStateDto;
import com.example.demo.dto.PlayerHandDto;
import com.example.demo.dto.ProgramRegisterDto;
import com.example.demo.dto.TurnResolutionDto;
import com.example.demo.service.GameService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/game")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @PostMapping("/{roomId}/join")
    public ResponseEntity<RobotStateDto> joinRoom(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal Jwt jwt) {

        // Use secure JWT subject instead of trusting @RequestParam String playerId
        String authenticatedUserId = jwt.getSubject();
        return ResponseEntity.ok(gameService.joinRoom(roomId, authenticatedUserId));
    }

    @GetMapping("/{roomId}/hand")
    public ResponseEntity<PlayerHandDto> getPlayerHand(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal Jwt jwt) {

        String authenticatedUserId = jwt.getSubject();
        PlayerHandDto hand = gameService.getPlayerHand(roomId, authenticatedUserId);
        return ResponseEntity.ok(hand);
    }

    @PostMapping("/{roomId}/registers")
    public ResponseEntity<String> submitRegisters(
            @PathVariable UUID roomId,
            @RequestBody ProgramRegisterDto request,
            @AuthenticationPrincipal Jwt jwt) {

        if (request.registers().size() != 5) {
            return ResponseEntity.badRequest().body("Must submit exactly 5 register slots.");
        }

        String authenticatedUserId = jwt.getSubject();
        gameService.submitPlayerRegisters(roomId, authenticatedUserId, request);
        return ResponseEntity.ok("Registers locked in successfully.");
    }

    @PostMapping("/{roomId}/complete-round")
    public ResponseEntity<String> completeRound(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal Jwt jwt) {

        String authenticatedUserId = jwt.getSubject();
        gameService.completeRound(roomId, authenticatedUserId);
        return ResponseEntity.ok("Round completed successfully.");
    }

    @PostMapping("/{roomId}/resolve")
    public ResponseEntity<?> resolveTurn(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            return ResponseEntity.ok(gameService.resolveTurn(roomId));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }

    @GetMapping("/{roomId}/state")
    public ResponseEntity<?> getBoardState(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            return ResponseEntity.ok(gameService.getBoardState(roomId));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    // --- Exception Handlers ---

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<String> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
    }
}