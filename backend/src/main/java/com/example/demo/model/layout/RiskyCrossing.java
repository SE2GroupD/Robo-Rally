package com.example.demo.model.layout;

import com.example.demo.model.Conveyor;
import com.example.demo.model.Direction;
import com.example.demo.model.GearRotation;
import com.example.demo.model.Tile;

import java.util.List;

/** Board 5A in the supplied orientation, with only implemented objects. */
public final class RiskyCrossing {

    private RiskyCrossing() {
    }

    public static MapLayout layout() {
        return new MapLayout("risky-crossing", "Risky Crossing", List.of(
                new PlacedBoard("start", BoardKind.START, 0, 0, 0, StartBoardTemplate.tiles()),
                new PlacedBoard("game-1", BoardKind.GAME, 3, 0, 0, List.of(
                        Tile.checkpoint(5, 7, 1),
                        Tile.checkpoint(8, 0, 2),
                        Tile.gearTile(1, 9, GearRotation.CLOCKWISE),
                        Tile.conveyorTile(3, 1, new Conveyor(Direction.SOUTH, false)),
                        Tile.conveyorTile(4, 1, new Conveyor(Direction.WEST, false)),
                        Tile.conveyorTile(5, 1, new Conveyor(Direction.WEST, false)),
                        Tile.conveyorTile(3, 2, new Conveyor(Direction.SOUTH, false)),
                        Tile.conveyorTile(5, 2, new Conveyor(Direction.NORTH, false)),
                        Tile.conveyorTile(2, 3, new Conveyor(Direction.SOUTH, false)),
                        Tile.conveyorTile(3, 3, new Conveyor(Direction.WEST, false)),
                        Tile.conveyorTile(5, 3, new Conveyor(Direction.NORTH, false)),
                        Tile.conveyorTile(6, 3, new Conveyor(Direction.WEST, false)),
                        Tile.conveyorTile(7, 3, new Conveyor(Direction.WEST, false)),
                        Tile.conveyorTile(8, 3, new Conveyor(Direction.WEST, false)),
                        Tile.conveyorTile(1, 4, new Conveyor(Direction.SOUTH, false)),
                        Tile.conveyorTile(2, 4, new Conveyor(Direction.WEST, false)),
                        Tile.conveyorTile(8, 4, new Conveyor(Direction.NORTH, false)),
                        Tile.conveyorTile(1, 5, new Conveyor(Direction.SOUTH, false)),
                        Tile.conveyorTile(7, 5, new Conveyor(Direction.EAST, false)),
                        Tile.conveyorTile(8, 5, new Conveyor(Direction.NORTH, false)),
                        Tile.conveyorTile(1, 6, new Conveyor(Direction.EAST, false)),
                        Tile.conveyorTile(2, 6, new Conveyor(Direction.EAST, false)),
                        Tile.conveyorTile(3, 6, new Conveyor(Direction.EAST, false)),
                        Tile.conveyorTile(4, 6, new Conveyor(Direction.SOUTH, false)),
                        Tile.conveyorTile(6, 6, new Conveyor(Direction.EAST, false)),
                        Tile.conveyorTile(7, 6, new Conveyor(Direction.NORTH, false)),
                        Tile.conveyorTile(4, 7, new Conveyor(Direction.SOUTH, false)),
                        Tile.conveyorTile(6, 7, new Conveyor(Direction.NORTH, false)),
                        Tile.conveyorTile(4, 8, new Conveyor(Direction.EAST, false)),
                        Tile.conveyorTile(5, 8, new Conveyor(Direction.EAST, false)),
                        Tile.conveyorTile(6, 8, new Conveyor(Direction.NORTH, false)),
                        Tile.conveyorTile(1, 0, new Conveyor(Direction.SOUTH, true)),
                        Tile.conveyorTile(1, 1, new Conveyor(Direction.SOUTH, true)),
                        Tile.conveyorTile(1, 2, new Conveyor(Direction.WEST, true)),
                        Tile.conveyorTile(0, 2, new Conveyor(Direction.WEST, true)),
                        Tile.conveyorTile(7, 0, new Conveyor(Direction.NORTH, true)),
                        Tile.conveyorTile(7, 1, new Conveyor(Direction.NORTH, true)),
                        Tile.conveyorTile(8, 1, new Conveyor(Direction.WEST, true)),
                        Tile.conveyorTile(9, 1, new Conveyor(Direction.WEST, true)),
                        Tile.conveyorTile(0, 8, new Conveyor(Direction.EAST, true)),
                        Tile.conveyorTile(1, 8, new Conveyor(Direction.EAST, true)),
                        Tile.conveyorTile(2, 8, new Conveyor(Direction.SOUTH, true)),
                        Tile.conveyorTile(2, 9, new Conveyor(Direction.SOUTH, true)),
                        Tile.conveyorTile(8, 9, new Conveyor(Direction.NORTH, true)),
                        Tile.conveyorTile(8, 8, new Conveyor(Direction.NORTH, true)),
                        Tile.conveyorTile(8, 7, new Conveyor(Direction.EAST, true)),
                        Tile.conveyorTile(9, 7, new Conveyor(Direction.EAST, true))))));
    }
}
