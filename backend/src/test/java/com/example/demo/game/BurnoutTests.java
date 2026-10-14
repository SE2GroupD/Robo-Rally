package com.example.demo.game;

import com.example.demo.model.Direction;
import com.example.demo.model.GearRotation;
import com.example.demo.model.Position;
import com.example.demo.model.Tile;
import com.example.demo.service.MapLayoutService;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

class BurnoutTests {

    @Test
    void preservesReferenceTerrainAndCompilesCourseCheckpoints() {
        var layout = new MapLayoutService().getLayout("burnout");
        var tiles = layout.boards().getLast().tiles();
        var board = GameBoard.training(layout);
        var pits = tiles.stream().filter(Tile::hasPit)
                .map(tile -> new Position(tile.x(), tile.y())).collect(Collectors.toSet());

        assertEquals(Set.of(new Position(4, 1), new Position(8, 4),
                new Position(1, 5), new Position(5, 8)), pits);
        assertEquals(16, tiles.stream().filter(tile -> tile.conveyor() != null && tile.conveyor().isExpress()).count());
        assertEquals(4, tiles.stream().filter(tile -> tile.conveyor() != null && !tile.conveyor().isExpress()).count());
        assertEquals(8, tiles.stream().filter(tile -> tile.walls() != null).count());
        assertEquals(GearRotation.CLOCKWISE, board.gearAt(new Position(7, 4)));
        assertEquals(new Position(1, 0), board.getSpawnPositions().getFirst());

        int[][] checkpoints = {{8, 5}, {0, 0}, {9, 9}};
        for (int index = 0; index < checkpoints.length; index++) {
            int x = checkpoints[index][0];
            int y = checkpoints[index][1];
            var local = tiles.stream().filter(tile -> tile.x() == x && tile.y() == y).findFirst().orElseThrow();

            assertEquals(index + 1, local.checkpointNumber());
            assertEquals(index + 1, board.checkpointAt(new Position(x + 3, y)));
        }
    }

    @Test
    void expressBeltFormsAClockwiseLoopAndWallsBlockTheirPicturedEdges() {
        var board = GameBoard.training(new MapLayoutService().getLayout("burnout"));
        var start = new Position(6, 3);
        var position = start;
        var visited = new HashSet<Position>();

        do {
            assertTrue(visited.add(position));
            var belt = board.conveyorAt(position);
            assertNotNull(belt);
            assertTrue(belt.isExpress());
            position = position.moveIn(belt.direction(), 1);
        } while (!position.equals(start));

        assertEquals(12, visited.size());

        for (var edge : List.of(
                new BlockedEdge(5, 2, Direction.NORTH), new BlockedEdge(6, 2, Direction.WEST),
                new BlockedEdge(10, 2, Direction.EAST), new BlockedEdge(10, 3, Direction.NORTH),
                new BlockedEdge(5, 6, Direction.SOUTH), new BlockedEdge(5, 7, Direction.WEST),
                new BlockedEdge(9, 7, Direction.EAST), new BlockedEdge(10, 7, Direction.SOUTH))) {
            assertFalse(board.canMove(new Position(edge.x(), edge.y()), edge.direction()));
        }
    }

    private record BlockedEdge(int x, int y, Direction direction) {
    }
}
