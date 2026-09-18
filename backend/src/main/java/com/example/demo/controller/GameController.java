package com.example.demo.controller;

import com.example.demo.dto.BoardStateDto;
import com.example.demo.dto.PlayerHandDto;
import com.example.demo.dto.ProgramRegisterDto;
import com.example.demo.dto.TurnResolutionDto;
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

    @GetMapping("/{roomId}/hand")
    public ResponseEntity<PlayerHandDto> getPlayerHand(
            @PathVariable UUID roomId,
            @RequestParam String playerId) {
        return ResponseEntity.ok(gameService.getPlayerHand(roomId, playerId));
    }

    @PostMapping("/{roomId}/registers")
    public ResponseEntity<Void> submitRegisters(
            @PathVariable UUID roomId,
            @RequestBody ProgramRegisterDto registerDto) {
        gameService.submitPlayerRegisters(roomId, registerDto);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{roomId}/resolve")
    public ResponseEntity<TurnResolutionDto> resolveTurn(@PathVariable UUID roomId) {
        return ResponseEntity.ok(gameService.resolveTurn(roomId));
    }

    @GetMapping("/{roomId}/board")
    public ResponseEntity<BoardStateDto> getBoardState(@PathVariable UUID roomId) {
        return ResponseEntity.ok(gameService.getBoardState(roomId));
    }
}