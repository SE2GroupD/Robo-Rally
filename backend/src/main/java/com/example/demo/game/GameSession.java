package com.example.demo.game;

import com.example.demo.model.CardType;
import com.example.demo.model.Direction;
import com.example.demo.model.Position;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tracks the live active game loop, robot positions, and programming decks for an active room.
 */
public class GameSession {

    private final GameBoard board;
    private final Map<String, Robot> robots = new ConcurrentHashMap<>();
    private final Map<String, ProgrammingDeck> decks = new ConcurrentHashMap<>();
    private final Map<String, List<CardType>> submittedRegisters = new LinkedHashMap<>();

    public GameSession(GameBoard board) {
        this.board = board;
    }

    public GameBoard getBoard() {
        return board;
    }

    public Map<String, Robot> getRobots() {
        return robots;
    }

    public ProgrammingDeck getOrCreateDeck(String playerId) {
        return decks.computeIfAbsent(playerId, id -> new ProgrammingDeck());
    }

    public Robot getOrCreateRobot(String playerId, Position startPosition, Direction startDirection) {
        return robots.computeIfAbsent(playerId, id -> new Robot(id, startPosition, startDirection));
    }

    public void submitRegisters(String playerId, List<CardType> registers) {
        if (!robots.containsKey(playerId)) {
            throw new IllegalStateException("Player " + playerId + " has no robot in this session yet.");
        }
        submittedRegisters.put(playerId, registers);
    }

    public boolean allPlayersHaveSubmitted() {
        return !robots.isEmpty() && submittedRegisters.keySet().containsAll(robots.keySet());
    }

    public Map<Robot, List<CardType>> buildResolutionInput() {
        Map<Robot, List<CardType>> input = new LinkedHashMap<>();
        for (Map.Entry<String, List<CardType>> entry : submittedRegisters.entrySet()) {
            input.put(robots.get(entry.getKey()), entry.getValue());
        }
        return input;
    }

    public void clearSubmittedRegisters() {
        submittedRegisters.clear();
    }
}