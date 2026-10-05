package com.example.demo.game;

import com.example.demo.model.Direction;
import com.example.demo.model.Position;
import com.example.demo.model.Tile;
import com.example.demo.model.Walls;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RobotTests {

    @Test
    void robotCannotMoveThroughWall() {
        GameBoard board = new GameBoard(5, 5,
            List.of(Tile.withWalls(2, 2, new Walls(false, true, false, false))),List.of()
        );

        Robot robot = new Robot(
                "player1",
                new Position(2, 2),
                Direction.EAST
        );

        robot.moveForward(board, 1);

        assertEquals(new Position(2, 2), robot.getPosition());
    }

    @Test
    void robotStopsAtWallDuringMultiSpaceMovement() {
        GameBoard board = new GameBoard(5, 5,
                List.of(Tile.withWalls(2, 2, new Walls(false, true, false, false))),List.of()
                );

        Robot robot = new Robot("player1", new Position(1, 2), Direction.EAST);

        robot.moveForward(board, 3);

        assertEquals(new Position(2, 2), robot.getPosition());
    }

}