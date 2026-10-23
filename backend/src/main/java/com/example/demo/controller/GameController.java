package com.example.demo.controller;

import com.example.demo.dto.BoardStateDto;
import com.example.demo.dto.PlayerHandDto;
import com.example.demo.dto.ProgramRegisterDto;
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

    @GetMapping("/{roomId}/hand")
    public ResponseEntity<PlayerHandDto> getPlayerHand(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(gameService.getPlayerHand(roomId, jwt.getSubject()));
    }

    /** Locks in registers. The round resolves automatically when the last player locks in. */
    @PostMapping("/{roomId}/registers")
    public ResponseEntity<String> submitRegisters(
            @PathVariable UUID roomId,
            @RequestBody ProgramRegisterDto request,
            @AuthenticationPrincipal Jwt jwt) {

        if (request.registers() == null || request.registers().size() != 5) {
            return ResponseEntity.badRequest().body("Must submit exactly 5 cards.");
        }
        gameService.submitPlayerRegisters(roomId, jwt.getSubject(), request);
        return ResponseEntity.ok("Registers locked in successfully.");
    }

    @GetMapping("/{roomId}/state")
    public ResponseEntity<BoardStateDto> getBoardState(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(gameService.getBoardState(roomId, jwt.getSubject()));
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
