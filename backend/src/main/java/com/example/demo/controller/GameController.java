package com.example.demo.controller;

import com.example.demo.dto.PlayerHandDto;
import com.example.demo.dto.ProgramRegisterDto;
import com.example.demo.service.GameService; // Import the service
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/game")
public class GameController {

    private final GameService gameService;

    // Spring Boot automatically injects the GameServiceImpl here
    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @GetMapping("/{roomId}/player/{playerId}/hand")
    public ResponseEntity<PlayerHandDto> getPlayerHand(
            @PathVariable UUID roomId, 
            @PathVariable String playerId) {
        
        // Delegate to the service to draw the cards
        PlayerHandDto hand = gameService.getPlayerHand(roomId, playerId);
        return ResponseEntity.ok(hand);
    }

    @PostMapping("/{roomId}/register")
    public ResponseEntity<String> submitRegisters(
            @PathVariable UUID roomId, 
            @RequestBody ProgramRegisterDto request) {
        
        if (request.registers() == null || request.registers().isEmpty()
                || request.registers().size() > 5
                || request.registers().stream().anyMatch(java.util.Objects::isNull)) {
            return ResponseEntity.badRequest().body("Must submit 1 to 5 non-null cards.");
        }
        
        // Delegate to the service to process the submission
        gameService.submitPlayerRegisters(roomId, request);
        
        return ResponseEntity.ok("Registers locked in successfully.");
    }
}