package com.example.demo.model.layout;

import com.example.demo.model.Conveyor;
import com.example.demo.model.Direction;
import com.example.demo.model.GearRotation;
import com.example.demo.model.Tile;
import com.example.demo.model.Walls;

import java.util.List;

/** Board 4A in the supplied orientation. Source coordinates are documented in backend/README.md. */
public final class ExtraCrispy {

    private ExtraCrispy() {
    }

    public static MapLayout layout() {
        return new MapLayout("extra-crispy", "Extra Crispy", List.of(
                new PlacedBoard("start", BoardKind.START, 0, 0, 0, StartBoardTemplate.tiles()),
                new PlacedBoard("game-1", BoardKind.GAME, 3, 0, 0, List.of(
                        Tile.pit(3, 2),
                        Tile.pit(3, 3),
                        Tile.pit(3, 6),
                        Tile.pit(3, 7),
                        Tile.pit(6, 2),
                        Tile.pit(6, 3),
                        Tile.pit(6, 6),
                        Tile.pit(6, 7),
                        Tile.checkpoint(7, 2, 1),
                        Tile.checkpoint(2, 7, 2),
                        Tile.checkpoint(7, 7, 3),
                        Tile.checkpoint(2, 2, 4),
                        Tile.conveyorTile(1, 0, new Conveyor(Direction.SOUTH, true)),
                        Tile.conveyorTile(1, 1, new Conveyor(Direction.SOUTH, true)),
                        Tile.conveyorTile(1, 2, new Conveyor(Direction.SOUTH, true)),
                        Tile.conveyorTile(8, 1, new Conveyor(Direction.SOUTH, true)),
                        Tile.conveyorTile(8, 2, new Conveyor(Direction.SOUTH, true)),
                        Tile.conveyorTile(1, 7, new Conveyor(Direction.NORTH, true)),
                        Tile.conveyorTile(1, 8, new Conveyor(Direction.NORTH, true)),
                        Tile.conveyorTile(8, 7, new Conveyor(Direction.NORTH, true)),
                        Tile.conveyorTile(8, 8, new Conveyor(Direction.NORTH, true)),
                        Tile.conveyorTile(8, 9, new Conveyor(Direction.NORTH, true)),
                        Tile.conveyorTile(1, 3, new Conveyor(Direction.EAST, true)),
                        Tile.conveyorTile(2, 3, new Conveyor(Direction.EAST, true)),
                        Tile.conveyorTile(8, 3, new Conveyor(Direction.WEST, true)),
                        Tile.conveyorTile(7, 3, new Conveyor(Direction.WEST, true)),
                        Tile.conveyorTile(1, 6, new Conveyor(Direction.EAST, true)),
                        Tile.conveyorTile(2, 6, new Conveyor(Direction.EAST, true)),
                        Tile.conveyorTile(8, 6, new Conveyor(Direction.WEST, true)),
                        Tile.conveyorTile(7, 6, new Conveyor(Direction.WEST, true)),
                        Tile.conveyorTile(4, 1, new Conveyor(Direction.WEST, false)),
                        Tile.conveyorTile(3, 1, new Conveyor(Direction.SOUTH, false)),
                        Tile.conveyorTile(5, 8, new Conveyor(Direction.EAST, false)),
                        Tile.conveyorTile(6, 8, new Conveyor(Direction.NORTH, false)),
                        Tile.gearTile(3, 4, GearRotation.CLOCKWISE),
                        Tile.gearTile(6, 5, GearRotation.COUNTERCLOCKWISE),
                        Tile.withWalls(5, 0, new Walls(false, true, false, false)),
                        Tile.withWalls(8, 0, new Walls(false, false, false, true)),
                        Tile.withWalls(4, 3, new Walls(false, false, false, true)),
                        Tile.withWalls(5, 3, new Walls(false, true, false, false)),
                        Tile.withWalls(0, 4, new Walls(true, false, false, false)),
                        Tile.withWalls(7, 4, new Walls(false, false, false, true)),
                        Tile.withWalls(3, 5, new Walls(false, false, false, true)),
                        Tile.withWalls(0, 5, new Walls(false, false, true, false)),
                        Tile.withWalls(9, 4, new Walls(true, false, false, false)),
                        Tile.withWalls(9, 5, new Walls(false, false, true, false)),
                        Tile.withWalls(4, 6, new Walls(false, false, false, true)),
                        Tile.withWalls(5, 6, new Walls(false, true, false, false)),
                        Tile.withWalls(1, 9, new Walls(false, false, false, true)),
                        Tile.withWalls(3, 9, new Walls(false, true, false, false))))));
    }
}
