package com.example.demo.game;

import com.example.demo.model.Direction;
import com.example.demo.model.Position;
import com.example.demo.model.Tile;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GameSessionCheckpointTest {

    private static GameSession sessionWithCheckpoints() {
        GameBoard board = new GameBoard(
                5,
                5,
                List.of(Tile.checkpoint(1, 1, 1), Tile.checkpoint(2, 1, 2), Tile.checkpoint(3, 3, 2)),
                List.of());
        return new GameSession(board);
    }

    @Test
    void playerStartsNeedingFirstCheckpoint() {
        GameSession session = sessionWithCheckpoints();
        session.addPlayer("player-1", new Position(0, 0), Direction.EAST);

        assertEquals(1, session.getNextCheckpointFor("player-1"));
        assertEquals(List.of(), session.getCompletedCheckpointsFor("player-1"));
    }

    @Test
    void creditsTheNextRequiredCheckpoint() {
        GameSession session = sessionWithCheckpoints();
        session.addPlayer("player-1", new Position(1, 1), Direction.EAST);
        Robot robot = session.getRobots().get("player-1");

        assertTrue(session.claimCheckpointIfNext(robot));
        assertEquals(2, session.getNextCheckpointFor("player-1"));
        assertEquals(List.of(1), session.getCompletedCheckpointsFor("player-1"));
    }

    @Test
    void ignoresLaterCheckpointBeforeEarlierOne() {
        GameSession session = sessionWithCheckpoints();
        session.addPlayer("player-1", new Position(3, 3), Direction.EAST);
        Robot robot = session.getRobots().get("player-1");

        assertFalse(session.claimCheckpointIfNext(robot));
        assertEquals(1, session.getNextCheckpointFor("player-1"));
        assertEquals(List.of(), session.getCompletedCheckpointsFor("player-1"));
    }

    @Test
    void cannotClaimTheSameCheckpointTwice() {
        GameSession session = sessionWithCheckpoints();
        session.addPlayer("player-1", new Position(1, 1), Direction.EAST);
        Robot robot = session.getRobots().get("player-1");

        assertTrue(session.claimCheckpointIfNext(robot));
        assertFalse(session.claimCheckpointIfNext(robot));
        assertEquals(2, session.getNextCheckpointFor("player-1"));
        assertEquals(List.of(1), session.getCompletedCheckpointsFor("player-1"));
    }

    @Test
    void allowsCheckpointTwoAfterCheckpointOne() {
        GameSession session = sessionWithCheckpoints();
        session.addPlayer("player-1", new Position(1, 1), Direction.EAST);
        Robot robot = session.getRobots().get("player-1");

        assertTrue(session.claimCheckpointIfNext(robot));
        robot.moveForward(session.getBoard(), 1);

        assertTrue(session.claimCheckpointIfNext(robot));
        assertEquals(3, session.getNextCheckpointFor("player-1"));
        assertEquals(List.of(1, 2), session.getCompletedCheckpointsFor("player-1"));
    }
}
