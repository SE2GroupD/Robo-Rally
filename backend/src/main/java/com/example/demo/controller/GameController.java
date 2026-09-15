package com.example.demo.controller;

import com.example.demo.dto.PlayerHandDto;
import com.example.demo.dto.ProgramRegisterDto;
import com.example.demo.service.GameService;
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

    @GetMapping("/{roomId}/hand")
    public ResponseEntity<PlayerHandDto> getPlayerHand(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal Jwt jwt) {

        // Rely purely on the cryptographic JWT subject
        String authenticatedUserId = jwt.getSubject();
        PlayerHandDto hand = gameService.getPlayerHand(roomId, authenticatedUserId);

        return ResponseEntity.ok(hand);
    }

    @PostMapping("/{roomId}/register")
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
}