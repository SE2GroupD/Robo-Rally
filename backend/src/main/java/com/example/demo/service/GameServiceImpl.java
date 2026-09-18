package com.example.demo.service;

import com.example.demo.dto.BoardStateDto;
import com.example.demo.dto.PlayerHandDto;
import com.example.demo.dto.ProgramRegisterDto;
import com.example.demo.dto.RegisterStepDto;
import com.example.demo.dto.RobotStateDto;
import com.example.demo.dto.RobotStepDto;
import com.example.demo.dto.TurnResolutionDto;
import com.example.demo.exception.PlayerNotInRoomException;
import com.example.demo.exception.RoomNotFoundException;
import com.example.demo.game.GameBoard;
import com.example.demo.game.GameSession;
import com.example.demo.game.MovementResolver;
import com.example.demo.game.ProgrammingDeck;
import com.example.demo.game.Robot;
import com.example.demo.model.CardType;
import com.example.demo.model.Direction;
import com.example.demo.model.Position;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameServiceImpl implements GameService {

    private static final int REGISTER_COUNT = 5;
    private static final int DEFAULT_HAND_SIZE = 9;
    private static final int DEFAULT_BOARD_WIDTH = 12;
    private static final int DEFAULT_BOARD_HEIGHT = 12;

    // Rooms are scoped by roomId now, fixing the earlier bug where decks were
    // keyed only by playerId and would collide across different rooms.
    private final Map<UUID, GameSession> rooms = new ConcurrentHashMap<>();
    private final MovementResolver movementResolver = new MovementResolver();
    private final RoomService roomService;

    public GameServiceImpl(RoomService roomService) {
        this.roomService = roomService;
    }

    @Override
    public PlayerHandDto getPlayerHand(UUID roomId, String playerId) {
        GameSession room = getOrCreateAndSyncSession(roomId, playerId);

        ProgrammingDeck deck = room.getOrCreateDeck(playerId);

        List<CardType> safeHand;
        synchronized (deck) {
            if (deck.getCurrentHand().isEmpty()) {
                safeHand = deck.drawCards(DEFAULT_HAND_SIZE);
            } else {
                safeHand = new ArrayList<>(deck.getCurrentHand());
            }
        }

        return new PlayerHandDto(playerId, safeHand, deck.getDrawPileSize(), deck.getDiscardPileSize());
    }

    @Override
    public void submitPlayerRegisters(UUID roomId, ProgramRegisterDto registerDto) {
        if (registerDto.registers().size() != REGISTER_COUNT) {
            throw new IllegalArgumentException("Must submit exactly " + REGISTER_COUNT + " register slots.");
        }
        String playerId = registerDto.playerId();
        GameSession room = getOrCreateAndSyncSession(roomId, playerId);

        ProgrammingDeck deck = room.getOrCreateDeck(playerId);

        // Synchronize on the deck so hand/discard pile modifications remain thread-safe
        synchronized (deck) {
            deck.discardRemainingHand(new ArrayList<>(registerDto.registers()));
        }

        room.submitRegisters(playerId, registerDto.registers());
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

    @Override
    public BoardStateDto getBoardState(UUID roomId) {
        GameSession room = getExistingRoom(roomId);
        return toBoardStateDto(roomId, room);
    }

    private GameSession getOrCreateAndSyncSession(UUID roomId, String playerId) {
        boolean isTrainingRoom = roomId.toString().equals("123e4567-e89b-12d3-a456-426614174000");

        if (!isTrainingRoom) {
            com.example.demo.model.GameRoom lobbyRoom = roomService.getRoomByGameId(roomId);
            if (lobbyRoom == null) {
                throw new RoomNotFoundException("Room " + roomId + " does not exist in RoomService.");
            }

            boolean isPlayerInLobby = lobbyRoom.players().stream().anyMatch(player ->
                    player.playerId().toString().equals(playerId) || player.playerName().equals(playerId)
            );

            if (!isPlayerInLobby) {
                throw new PlayerNotInRoomException("Player " + playerId + " has not joined room " + roomId + ".");
            }
        }

        GameSession room = rooms.computeIfAbsent(roomId,
                id -> new GameSession(new GameBoard(DEFAULT_BOARD_WIDTH, DEFAULT_BOARD_HEIGHT)));

        if (!room.getRobots().containsKey(playerId)) {
            Position spawnPosition = new Position(room.getRobots().size(), 0);
            room.getOrCreateRobot(playerId, spawnPosition, Direction.SOUTH);
        }

        return room;
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
        return new BoardStateDto(roomId, room.getBoard().getWidth(), room.getBoard().getHeight(), robotStates);
    }
}