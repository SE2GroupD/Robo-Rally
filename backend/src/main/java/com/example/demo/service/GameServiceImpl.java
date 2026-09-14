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
import com.example.demo.game.GameRoom;
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
    private final Map<UUID, GameRoom> rooms = new ConcurrentHashMap<>();
    private final MovementResolver movementResolver = new MovementResolver();

    @Override
    public RobotStateDto joinRoom(UUID roomId, String playerId) {
        GameRoom room = getOrCreateRoom(roomId);
        // Placeholder spawn logic, robots along the top row.
        Position spawnPosition = new Position(room.getRobots().size(), 0);
        Robot robot = room.getOrCreateRobot(playerId, spawnPosition, Direction.SOUTH);
        return toRobotStateDto(robot);
    }

    @Override
    public PlayerHandDto getPlayerHand(UUID roomId, String playerId) {
        GameRoom room = getExistingRoom(roomId);
        requirePlayerHasJoined(room, playerId);
        ProgrammingDeck deck = room.getOrCreateDeck(playerId);
        List<CardType> hand = deck.drawCards(DEFAULT_HAND_SIZE);
        return new PlayerHandDto(playerId, hand, deck.getDrawPileSize(), deck.getDiscardPileSize());
    }

    @Override
    public void submitPlayerRegisters(UUID roomId, ProgramRegisterDto registerDto) {
        if (registerDto.registers().size() != REGISTER_COUNT) {
            throw new IllegalArgumentException("Must submit exactly " + REGISTER_COUNT + " register slots.");
        }
        GameRoom room = getExistingRoom(roomId);

        String playerId = registerDto.playerId();
        requirePlayerHasJoined(room, playerId);
        ProgrammingDeck deck = room.getOrCreateDeck(playerId);

        deck.discardRemainingHand(new ArrayList<>(registerDto.registers()));

        room.submitRegisters(playerId, registerDto.registers());
    }

    @Override
    public TurnResolutionDto resolveTurn(UUID roomId) {
        GameRoom room = getExistingRoom(roomId);
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
        GameRoom room = getExistingRoom(roomId);
        return toBoardStateDto(roomId, room);
    }

    private GameRoom getOrCreateRoom(UUID roomId) {
        return rooms.computeIfAbsent(roomId,
                id -> new GameRoom(new GameBoard(DEFAULT_BOARD_WIDTH, DEFAULT_BOARD_HEIGHT)));
    }

    private GameRoom getExistingRoom(UUID roomId) {
        GameRoom room = rooms.get(roomId);
        if (room == null) {
            throw new RoomNotFoundException("Room " + roomId + " does not exist.");
        }
        return room;
    }

    private void requirePlayerHasJoined(GameRoom room, String playerId) {
        if (!room.getRobots().containsKey(playerId)) {
            throw new PlayerNotInRoomException(
                    "Player " + playerId + " hasn't joined this room yet. Call /join first.");
        }
    }

    private RobotStateDto toRobotStateDto(Robot robot) {
        return new RobotStateDto(robot.getPlayerId(), robot.getPosition().x(),
                robot.getPosition().y(), robot.getDirection());
    }

    private BoardStateDto toBoardStateDto(UUID roomId, GameRoom room) {
        List<RobotStateDto> robotStates = room.getRobots().values().stream()
                .map(this::toRobotStateDto)
                .toList();
        return new BoardStateDto(roomId, room.getBoard().getWidth(), room.getBoard().getHeight(), robotStates);
    }
}
