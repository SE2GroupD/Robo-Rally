package com.example.demo.service;

import com.example.demo.dto.BoardStateDto;
import com.example.demo.dto.PlayerHandDto;
import com.example.demo.dto.ProgramRegisterDto;
import com.example.demo.dto.RegisterStepDto;
import com.example.demo.dto.RobotStateDto;
import com.example.demo.dto.RobotStepDto;
import com.example.demo.dto.TurnResolutionDto;
import com.example.demo.game.GameBoard;
import com.example.demo.game.GameSession;
import com.example.demo.game.MovementResolver;
import com.example.demo.game.ProgrammingDeck;
import com.example.demo.game.Robot;
import com.example.demo.model.BoardDefinition;
import com.example.demo.model.CardType;
import com.example.demo.model.Direction;
import com.example.demo.model.GameRoom;
import com.example.demo.model.Position;
import com.example.demo.model.RoomPlayer;
import com.example.demo.model.RoomStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameServiceImpl implements GameService {

    private static final int HAND_SIZE = 9;

    private final RoomService roomService;
    private final BoardRegistry boardRegistry;
    private final MovementResolver movementResolver = new MovementResolver();
    private final Map<UUID, GameSession> sessions = new ConcurrentHashMap<>();

    public GameServiceImpl(RoomService roomService, BoardRegistry boardRegistry) {
        this.roomService = roomService;
        this.boardRegistry = boardRegistry;
    }

    /**
     * Verifies the caller is in the room (404/403 from RoomService), that the
     * room has started, and lazily creates the session from the room's players.
     */
    private GameSession sessionFor(UUID gameId, String playerId) {
        GameRoom room = roomService.getRoom(gameId, playerId);
        if (room.status() != RoomStatus.STARTED) {
            throw new IllegalStateException("The game has not started yet.");
        }
        return sessions.computeIfAbsent(gameId, id -> createSession(room));
    }

    private GameSession createSession(GameRoom room) {
        BoardDefinition startBoard = boardRegistry.getBoard(room.startBoardId());
        List<BoardDefinition> boards = new ArrayList<>();
        boards.add(startBoard);
        for (String id : List.of("game1", "game2", "game3")) {
            BoardDefinition b = boardRegistry.getBoardById(id);
            if (b != null) {
                boards.add(b);
            }
        }
        GameBoard board = GameBoard.assemble(boards);
        GameSession session = new GameSession(board);
        for (RoomPlayer player : room.players()) {
            Position startPos = player.startPosition();
            if (startPos == null) {
                throw new IllegalStateException("Player " + player.playerName() + " has no start position.");
            }
            session.addPlayer(player.playerId(), startPos, Direction.EAST);
        }
        return session;
    }

    @Override
    public PlayerHandDto getPlayerHand(UUID gameId, String playerId) {
        GameSession session = sessionFor(gameId, playerId);
        synchronized (session) {
            ProgrammingDeck deck = session.getDeck(playerId);
            List<CardType> hand;
            if (deck.isLockedIn()) {
                hand = new ArrayList<>();
            } else if (deck.getCurrentHand().isEmpty()) {
                hand = deck.drawCards(HAND_SIZE);
            } else {
                hand = new ArrayList<>(deck.getCurrentHand());
            }
            return new PlayerHandDto(
                    playerId,
                    hand,
                    deck.getDrawPileSize(),
                    deck.getDiscardPileSize(),
                    new ArrayList<>(deck.getLockedRegisters()),
                    deck.isLockedIn());
        }
    }

    @Override
    public void submitPlayerRegisters(UUID gameId, String playerId, ProgramRegisterDto request) {
        GameSession session = sessionFor(gameId, playerId);
        synchronized (session) {
            ProgrammingDeck deck = session.getDeck(playerId);
            if (deck.isLockedIn()) {
                throw new IllegalStateException("Registers are already locked in for this round.");
            }
            deck.discardRemainingHand(new ArrayList<>(request.registers()));
            session.submitRegisters(playerId, request.registers());

            if (session.allPlayersHaveSubmitted()) {
                resolveRound(session);
            }
        }
    }

    /** Caller MUST hold the monitor on session. */
    private void resolveRound(GameSession session) {
        Map<Robot, List<CardType>> resolutionInput = session.buildResolutionInput();

        // Snapshot initial robot poses so the replay has the starting frame
        // (before register 1 moves anything).
        List<RobotStateDto> starting = session.getRobots().values().stream()
                .map(r -> new RobotStateDto(r.getPlayerId(), r.getPosition().x(), r.getPosition().y(), r.getDirection()))
                .toList();

        List<RegisterStepDto> steps = new ArrayList<>();
        movementResolver.resolveRound(session.getBoard(), resolutionInput, (registerNumber, cardsPlayed) -> {
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

        // Played cards go to the discard pile here (prepareForNextRound) - and only here.
        for (String playerId : session.getRobots().keySet()) {
            session.getDeck(playerId).prepareForNextRound();
        }
        session.finishRound(new TurnResolutionDto(session.getRound(), starting, steps));
    }

    @Override
    public BoardStateDto getBoardState(UUID gameId, String playerId) {
        GameSession session = sessionFor(gameId, playerId);
        synchronized (session) {
            List<String> lockedIn = session.getRobots().keySet().stream()
                    .filter(id -> session.getDeck(id).isLockedIn())
                    .toList();
            GameBoard board = session.getBoard();
            return new BoardStateDto(
                    gameId,
                    board.getWidth(),
                    board.getHeight(),
                    robotStates(session),
                    board.getSpecialTiles(),
                    session.getRound(),
                    lockedIn,
                    session.getLastResolution());
        }
    }

    @Override
    public void removePlayer(UUID gameId, String playerId) {
        GameSession session = sessions.get(gameId);
        if (session == null) return;
        synchronized (session) {
            session.removePlayer(playerId);
            // The leaver may have been the only one we were waiting for.
            if (session.allPlayersHaveSubmitted()) {
                resolveRound(session);
            }
        }
    }

    @Override
    public void endGame(UUID gameId) {
        sessions.remove(gameId);
    }

    private List<RobotStateDto> robotStates(GameSession session) {
        return session.getRobots().values().stream()
                .map(r -> new RobotStateDto(r.getPlayerId(), r.getPosition().x(), r.getPosition().y(), r.getDirection()))
                .toList();
    }
}
