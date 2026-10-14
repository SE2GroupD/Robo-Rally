package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record Tile(
        @JsonProperty("x") int x,
        @JsonProperty("y") int y,
        @JsonProperty("hasPit") @JsonAlias({"hasPit", "pit", "isPit"}) boolean hasPit,
        @JsonProperty("walls") @JsonAlias({"walls", "wall", "isWall"}) Walls walls,
        @JsonProperty("hasAntenna") @JsonAlias({"hasAntenna", "antenna", "isAntenna"}) boolean hasAntenna,
        @JsonProperty("isSpawnPoint") @JsonAlias({"isSpawnPoint", "spawnPoint", "isSpawn", "spawn"}) boolean isSpawnPoint,
        @JsonProperty("gear") @JsonAlias({"gear", "gearRotation"}) GearRotation gear,
        @JsonProperty("conveyor") @JsonAlias({"conveyor", "conveyorTile"}) Conveyor conveyor,
        @JsonProperty("checkpointNumber") @JsonAlias({"checkpointNumber", "checkpoint", "isCheckpoint"}) Integer checkpointNumber,
        @JsonProperty("pushPanel") PushPanel pushPanel,
        @JsonProperty("occupyingPlayerId") @JsonAlias({"occupyingPlayerId", "occupant"}) String occupyingPlayerId
) {

    public Tile(int x, int y, boolean hasPit, Walls walls, boolean hasAntenna, boolean isSpawnPoint,
                GearRotation gear, Conveyor conveyor, Integer checkpointNumber, PushPanel pushPanel) {
        this(x, y, hasPit, walls, hasAntenna, isSpawnPoint, gear, conveyor, checkpointNumber, pushPanel, null);
    }

    public static Tile blank(int x, int y) {
        return new Tile(x, y, false, null, false, false, null, null, null, null, null);
    }

    public static Tile pit(int x, int y) {
        return new Tile(x, y, true, null, false, false, null, null, null, null, null);
    }

    public static Tile withWalls(int x, int y, Walls walls) {
        return new Tile(x, y, false, walls, false, false, null, null, null, null, null);
    }

    public static Tile antenna(int x, int y) {
        return new Tile(x, y, false, null, true, false, null, null, null, null, null);
    }

    public static Tile spawnPoint(int x, int y) {
        return new Tile(x, y, false, null, false, true, null, null, null, null, null);
    }

    public static Tile gearTile(int x, int y, GearRotation rotation) {
        return new Tile(x, y, false, null, false, false, rotation, null, null, null, null);
    }

    public static Tile conveyorTile(int x, int y, Conveyor conveyor) {
        return new Tile(x, y, false, null, false, false, null, conveyor, null, null, null);
    }

    public static Tile checkpoint(int x, int y, int number) {
        return new Tile(x, y, false, null, false, false, null, null, number, null, null);
    }

    public static Tile pushPanelTile(int x, int y, PushPanel pushPanel) {
        return new Tile(x, y, false, null, false, false, null, null, null, pushPanel, null);
    }

    public Tile withOccupant(String newPlayerId) {
        return new Tile(this.x, this.y, this.hasPit, this.walls, this.hasAntenna, 
                        this.isSpawnPoint, this.gear, this.conveyor, 
                        this.checkpointNumber, this.pushPanel, newPlayerId);
    }

    public boolean isAvailableSpawn() {
        return this.isSpawnPoint && (this.occupyingPlayerId == null);
    }
}