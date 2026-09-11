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
        
        if (request.registers().size() != 5) {
            return ResponseEntity.badRequest().body("Must submit exactly 5 register slots.");
        }
        
        // Delegate to the service to process the submission
        gameService.submitPlayerRegisters(roomId, request);
        
        return ResponseEntity.ok("Registers locked in successfully.");
    }
}