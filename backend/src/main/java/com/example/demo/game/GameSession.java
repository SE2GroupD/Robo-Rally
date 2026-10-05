package com.example.demo.game;

import com.example.demo.dto.TurnResolutionDto;
import com.example.demo.model.CardType;
import com.example.demo.model.Direction;
import com.example.demo.model.Position;

import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Live state of one started room: board, robots, each player's deck, the
 * registers submitted this round, and the last round's replay.
 * NOT thread-safe on its own: GameServiceImpl synchronizes on the session
 * for every read/write, so there is one lock per game.
 */
public class GameSession {

    private final GameBoard board;
    private final Map<String, Robot> robots = new LinkedHashMap<>();
    private final Map<String, ProgrammingDeck> decks = new HashMap<>();
    private final Map<String, List<CardType>> submittedRegisters = new HashMap<>();
    private int round = 1;
    private TurnResolutionDto lastResolution;

    public GameSession(GameBoard board) {
        this.board = board;
    }

    public GameBoard getBoard() { return board; }
    public int getRound() { return round; }
    public TurnResolutionDto getLastResolution() { return lastResolution; }

    public Map<String, Robot> getRobots() {
        return Collections.unmodifiableMap(robots);
    }

    public void addPlayer(String playerId, Position start, Direction facing) {
        robots.put(playerId, new Robot(playerId, start, facing));
        decks.put(playerId, new ProgrammingDeck());
    }

    public void addRobot(Robot robot) {
        robots.put(robot.getPlayerId(), robot);
        decks.put(robot.getPlayerId(), new ProgrammingDeck());
    }

    public void removePlayer(String playerId) {
        robots.remove(playerId);
        decks.remove(playerId);
        submittedRegisters.remove(playerId);
    }

    public ProgrammingDeck getDeck(String playerId) {
        ProgrammingDeck deck = decks.get(playerId);
        if (deck == null) {
            throw new IllegalStateException("Player " + playerId + " is not part of this game.");
        }
        return deck;
    }

    public void submitRegisters(String playerId, List<CardType> registers) {
        if (!robots.containsKey(playerId)) {
            throw new IllegalStateException("Player " + playerId + " has no robot in this session.");
        }
        submittedRegisters.put(playerId, registers);
    }

    public boolean allPlayersHaveSubmitted() {
        return !robots.isEmpty() && submittedRegisters.keySet().containsAll(robots.keySet());
    }

    /** Robots in a stable order (join order), so resolution is deterministic. */
    public Map<Robot, List<CardType>> buildResolutionInput() {
        Map<Robot, List<CardType>> input = new LinkedHashMap<>();
        for (Map.Entry<String, Robot> entry : robots.entrySet()) {
            List<CardType> registers = submittedRegisters.get(entry.getKey());
            if (registers != null) input.put(entry.getValue(), registers);
        }
        return input;
    }

    public void finishRound(TurnResolutionDto resolution) {
        lastResolution = resolution;
        submittedRegisters.clear();
        round++;
    }
}
