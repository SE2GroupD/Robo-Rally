package com.example.demo.controller;

import com.example.demo.dto.PlayerHandDto;
import com.example.demo.dto.ProgramRegisterDto;
import com.example.demo.service.GameService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/game")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @GetMapping("/{roomId}/player/{playerId}/hand")
    public ResponseEntity<PlayerHandDto> getPlayerHand(
            @PathVariable UUID roomId,
            @PathVariable String playerId,
            @AuthenticationPrincipal Jwt jwt) {

        // 1. Extract the verified user ID from the JWT token
        String authenticatedUserId = jwt.getSubject();

        // 2. Prevent users from requesting hands that don't belong to them
        if (!authenticatedUserId.equals(playerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Access denied: Cannot view another player's hand.");
        }

        PlayerHandDto hand = gameService.getPlayerHand(roomId, playerId);
        return ResponseEntity.ok(hand);
    }

    @PostMapping("/{roomId}/register")
    public ResponseEntity<String> submitRegisters(
            @PathVariable UUID roomId,
            @RequestBody ProgramRegisterDto request,
            @AuthenticationPrincipal Jwt jwt) {

        String authenticatedUserId = jwt.getSubject();

        // Ensure the player is only submitting registers for their own robot
        if (!authenticatedUserId.equals(request.playerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Access denied: Cannot submit registers for another player.");
        }

        if (request.registers().size() != 5) {
            return ResponseEntity.badRequest().body("Must submit exactly 5 register slots.");
        }

        gameService.submitPlayerRegisters(roomId, request);

        return ResponseEntity.ok("Registers locked in successfully.");
    }
}