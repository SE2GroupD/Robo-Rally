package com.example.demo.model;
 
import com.fasterxml.jackson.annotation.JsonInclude;
 

// Most tiles on the board are blank, use Tile.blank(x, y) for those
// Tiles that have something on it, set only the relevant fields and leave everything else at default.
// If a tile combines different properties, call the full constructor.

//JsonInclude avoids sending null attributes as they are optional on the frontend
@JsonInclude(JsonInclude.Include.NON_NULL)
public record Tile(
        int x,
        int y,
        boolean hasPit,
        Walls walls,
        boolean hasAntenna,
        boolean isSpawnPoint,
        GearRotation gear,
        Conveyor conveyor,
        Integer checkpointNumber
) {
 
    public static Tile blank(int x, int y) {
        return new Tile(x, y, false, null, false, false, null, null, null);
    }
 
    public static Tile pit(int x, int y) {
        return new Tile(x, y, true, null, false, false, null, null, null);
    }
 
    public static Tile withWalls(int x, int y, Walls walls) {
        return new Tile(x, y, false, walls, false, false, null, null, null);
    }
 
    public static Tile antenna(int x, int y) {
        return new Tile(x, y, false, null, true, false, null, null, null);
    }
 
    public static Tile spawnPoint(int x, int y) {
        return new Tile(x, y, false, null, false, true, null, null, null);
    }
 
    public static Tile gearTile(int x, int y, GearRotation rotation) {
        return new Tile(x, y, false, null, false, false, rotation, null, null);
    }
 
    public static Tile conveyorTile(int x, int y, Conveyor conveyor) {
        return new Tile(x, y, false, null, false, false, null, conveyor, null);
    }
 
    public static Tile checkpoint(int x, int y, int number) {
        return new Tile(x, y, false, null, false, false, null, null, number);
    }
}
