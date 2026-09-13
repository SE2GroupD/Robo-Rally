package com.example.demo.controller;

import com.example.demo.dto.PlayerHandDto;
import com.example.demo.dto.ProgramRegisterDto;
import com.example.demo.dto.RobotStateDto;
import com.example.demo.service.GameService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/game")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @PostMapping("/{roomId}/join")
    public ResponseEntity<RobotStateDto> joinRoom(@PathVariable UUID roomId, @RequestParam String playerId) {
        return ResponseEntity.ok(gameService.joinRoom(roomId, playerId));
    }

    @GetMapping("/{roomId}/player/{playerId}/hand")
    public ResponseEntity<PlayerHandDto> getPlayerHand(@PathVariable UUID roomId, @PathVariable String playerId) {
        return ResponseEntity.ok(gameService.getPlayerHand(roomId, playerId));
    }

    @PostMapping("/{roomId}/register")
    public ResponseEntity<String> submitRegisters(@PathVariable UUID roomId,
                                                    @RequestBody ProgramRegisterDto registerDto) {
        if (registerDto.registers().size() != 5) {
            return ResponseEntity.badRequest().body("Must submit exactly 5 register slots.");
        }
        try {
            gameService.submitPlayerRegisters(roomId, registerDto);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
        return ResponseEntity.ok("Registers locked in successfully.");
    }

    @PostMapping("/{roomId}/resolve")
    public ResponseEntity<?> resolveTurn(@PathVariable UUID roomId) {
        try {
            return ResponseEntity.ok(gameService.resolveTurn(roomId));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }

    @GetMapping("/{roomId}/state")
    public ResponseEntity<?> getBoardState(@PathVariable UUID roomId) {
        try {
            return ResponseEntity.ok(gameService.getBoardState(roomId));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }
}
