package com.example.demo.service;

import com.example.demo.dto.PlayerHandDto;
import com.example.demo.dto.ProgramRegisterDto;
import com.example.demo.game.ProgrammingDeck;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameServiceImpl implements GameService {

    // Temporary in-memory storage simulating a database of active player decks.
    // Key: playerId -> Value: ProgrammingDeck
    private final Map<String, ProgrammingDeck> activeDecks = new ConcurrentHashMap<>();

    @Override
    public PlayerHandDto getPlayerHand(UUID roomId, String playerId) {
        ProgrammingDeck deck = activeDecks.computeIfAbsent(playerId, id -> new ProgrammingDeck());

        // Draw 9 cards
        var drawnCards = deck.drawCards(9);

        // Return the hand along with the current pile sizes
        return new PlayerHandDto(
                playerId,
                drawnCards,
                deck.getDrawPileSize(),
                deck.getDiscardPileSize());
    }

    @Override
    public void submitPlayerRegisters(UUID roomId, ProgramRegisterDto request) {
        String playerId = request.playerId();
        ProgrammingDeck deck = activeDecks.get(playerId);

        if (deck == null) {
            throw new IllegalStateException("Player deck not found. Cannot submit registers.");
        }

        // The remaining unplayed cards in the player's hand are placed into their
        // discard pile
        // We pass the list of cards the player actually locked into their registers
        deck.discardRemainingHand(request.registers());

        System.out.println("Player " + playerId + " successfully locked in registers: " + request.registers());

        // At this point in a real game, you would save these registers to the Neon
        // Database
        // and check if all players have submitted to trigger the Activation Phase.
    }
}