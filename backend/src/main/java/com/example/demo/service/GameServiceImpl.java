package com.example.demo.service;

import com.example.demo.dto.BoardStateDto;
import com.example.demo.dto.PlayerHandDto;
import com.example.demo.dto.ProgramRegisterDto;
import com.example.demo.dto.RegisterStepDto;
import com.example.demo.dto.RobotStateDto;
import com.example.demo.dto.RobotStepDto;
import com.example.demo.dto.TurnResolutionDto;
import com.example.demo.exception.RoomNotFoundException;
import com.example.demo.game.GameBoard;
import com.example.demo.game.GameSession;
import com.example.demo.game.MovementResolver;
import com.example.demo.game.ProgrammingDeck;
import com.example.demo.game.Robot;
import com.example.demo.model.CardType;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameServiceImpl implements GameService {

    private record DeckKey(UUID roomId, String playerId) {
    }

    private static final int DEFAULT_HAND_SIZE = 9;
    // private static final int DEFAULT_BOARD_WIDTH = 12;
    // private static final int DEFAULT_BOARD_HEIGHT = 12;

    // Rooms are scoped by roomId now, fixing the earlier bug where decks were
    // keyed only by playerId and would collide across different rooms.
    private final Map<UUID, GameSession> rooms = new ConcurrentHashMap<>();
    private final MovementResolver movementResolver = new MovementResolver();

    private final Map<DeckKey, ProgrammingDeck> activeDecks = new ConcurrentHashMap<>();

    @Override
    public PlayerHandDto getPlayerHand(UUID roomId, String playerId) {
        DeckKey key = new DeckKey(roomId, playerId);
        ProgrammingDeck deck = activeDecks.computeIfAbsent(key, k -> new ProgrammingDeck());

        // Snapshot all state atomically while holding the deck monitor
        synchronized (deck) {
            List<CardType> safeHand;
            if (deck.isLockedIn()) {
                safeHand = new ArrayList<>();
            } else if (deck.getCurrentHand().isEmpty()) {
                safeHand = deck.drawCards(DEFAULT_HAND_SIZE);
            } else {
                safeHand = new ArrayList<>(deck.getCurrentHand());
            }

            // Create defensive copies of live lists and snapshot primitive values
            int drawPileSize = deck.getDrawPileSize();
            int discardPileSize = deck.getDiscardPileSize();
            List<CardType> safeLockedRegisters = new ArrayList<>(deck.getLockedRegisters());
            boolean isLockedIn = deck.isLockedIn();

            return new PlayerHandDto(
                    playerId,
                    safeHand,
                    drawPileSize,
                    discardPileSize,
                    safeLockedRegisters,
                    isLockedIn);
        }
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

    @Override
    public TurnResolutionDto resolveTurn(UUID roomId) {
        GameSession room = getExistingRoom(roomId);
        if (!room.allPlayersHaveSubmitted()) {
            throw new IllegalStateException("Not every player has submitted registers yet.");
        }

        Map<Robot, List<CardType>> resolutionInput = room.buildResolutionInput();
        List<RegisterStepDto> steps = new ArrayList<>();

        movementResolver.resolveRound(room.getBoard(), resolutionInput, (registerNumber, cardsPlayed) -> {
            List<RobotStepDto> robotSteps = cardsPlayed.entrySet().stream()
                    .map(entry -> new RobotStepDto(
                            entry.getKey().getPlayerId(),
                            entry.getValue(),
                            entry.getKey().getPosition().x(),
                            entry.getKey().getPosition().y(),
                            entry.getKey().getDirection()))
                    .toList();
            steps.add(new RegisterStepDto(registerNumber, robotSteps));
        });

        for (Map.Entry<Robot, List<CardType>> entry : resolutionInput.entrySet()) {
            room.getOrCreateDeck(entry.getKey().getPlayerId()).discardPlayedCards(entry.getValue());
        }
        room.clearSubmittedRegisters();

        return new TurnResolutionDto(roomId, room.getBoard().getWidth(), room.getBoard().getHeight(), steps);
    }

    private GameSession getOrCreateRoom(UUID roomId) {
    return rooms.computeIfAbsent(roomId,
            id -> new GameSession(GameBoard.classicWithSeedTiles()));
}

    @Override
    public BoardStateDto getBoardState(UUID roomId) {
        GameSession room = getOrCreateRoom(roomId);
        return toBoardStateDto(roomId, room);
    }

    private GameSession getExistingRoom(UUID roomId) {
        GameSession room = rooms.get(roomId);
        if (room == null) {
            throw new RoomNotFoundException("Room " + roomId + " does not exist.");
        }
        return room;
    }

    private RobotStateDto toRobotStateDto(Robot robot) {
        return new RobotStateDto(robot.getPlayerId(), robot.getPosition().x(),
                robot.getPosition().y(), robot.getDirection());
    }

    private BoardStateDto toBoardStateDto(UUID roomId, GameSession room) {
        List<RobotStateDto> robotStates = room.getRobots().values().stream()
                .map(this::toRobotStateDto)
                .toList();
        return new BoardStateDto(roomId, room.getBoard().getWidth(), room.getBoard().getHeight(), robotStates, room.getBoard().getSpecialTiles());
    }
}