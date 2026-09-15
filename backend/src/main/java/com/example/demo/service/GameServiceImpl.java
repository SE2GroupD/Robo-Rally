package com.example.demo.service;

import com.example.demo.dto.PlayerHandDto;
import com.example.demo.dto.ProgramRegisterDto;
import com.example.demo.game.ProgrammingDeck;
import com.example.demo.model.CardType;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameServiceImpl implements GameService {

    // A lightweight record to act as a composite key for the map
    private record DeckKey(UUID roomId, String playerId) {
    }

    // Key: DeckKey (Room + Player) -> Value: ProgrammingDeck
    private final Map<DeckKey, ProgrammingDeck> activeDecks = new ConcurrentHashMap<>();

    @Override
    public PlayerHandDto getPlayerHand(UUID roomId, String playerId) {
        DeckKey key = new DeckKey(roomId, playerId);
        List<CardType> safeHand = new ArrayList<>();

        ProgrammingDeck deck = activeDecks.computeIfAbsent(key, k -> new ProgrammingDeck());

        synchronized (deck) {
            if (deck.isLockedIn()) {
                safeHand = new ArrayList<>();
            } else if (deck.getCurrentHand().isEmpty()) {
                safeHand = deck.drawCards(9);
            } else {
                safeHand = new ArrayList<>(deck.getCurrentHand());
            }
        }

        return new PlayerHandDto(
                playerId,
                safeHand,
                deck.getDrawPileSize(),
                deck.getDiscardPileSize(),
                deck.getLockedRegisters(),
                deck.isLockedIn());
    }

    @Override
    public void submitPlayerRegisters(UUID roomId, String playerId, ProgramRegisterDto request) {
        DeckKey key = new DeckKey(roomId, playerId);
        ProgrammingDeck deck = activeDecks.get(key);

        if (deck == null) {
            throw new IllegalStateException("Player deck not found. Cannot submit registers.");
        }

        synchronized (deck) {
            if (deck.isLockedIn()) {
                throw new IllegalStateException("Registers are already locked in for this round.");
            }
            deck.discardRemainingHand(new ArrayList<>(request.registers()));
        }

        System.out.println("Player " + playerId + " successfully locked in registers in room " + roomId);
    }

    @Override
    public void completeRound(UUID roomId, String playerId) {
        DeckKey key = new DeckKey(roomId, playerId);
        ProgrammingDeck deck = activeDecks.get(key);

        if (deck == null) {
            throw new IllegalStateException("Player deck not found.");
        }

        synchronized (deck) {
            if (!deck.isLockedIn()) {
                throw new IllegalStateException("Cannot complete round: player hasn't locked in yet.");
            }

            // Clean up the executed cards and reset the lock
            deck.prepareForNextRound();
        }

        System.out.println("Player " + playerId + " completed the activation phase in room " + roomId
                + " and is ready for the next round.");
    }
}