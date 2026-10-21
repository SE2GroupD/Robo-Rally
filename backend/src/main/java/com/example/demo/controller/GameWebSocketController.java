package com.example.demo.controller;

import com.example.demo.dto.PlayerReadyEvent;
import com.example.demo.dto.PlayerReadyRequest;
import com.example.demo.service.GameService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class GameWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final GameService gameService;

    public GameWebSocketController(SimpMessagingTemplate messagingTemplate, GameService gameService) {
        this.messagingTemplate = messagingTemplate;
        this.gameService = gameService;
    }

    @MessageMapping("/game/{gameId}/player-ready")
    public void handlePlayerReady(
            @DestinationVariable String gameId, 
            @Payload PlayerReadyRequest request, 
            Principal principal) {
        
        // Get the real ID from the token, ignoring the client's payload request.playerId()
        String authenticatedPlayerId = principal.getName(); 

        // Update the backend game state using the secured ID
        gameService.markPlayerReady(gameId, authenticatedPlayerId, request.isReady());

        // Broadcast using the secured ID
        PlayerReadyEvent event = new PlayerReadyEvent(authenticatedPlayerId, request.isReady());
        messagingTemplate.convertAndSend("/topic/game/" + gameId + "/ready-status", event);
    }
}