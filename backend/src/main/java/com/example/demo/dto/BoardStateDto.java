package com.example.demo.dto;

import com.example.demo.model.Tile;

import java.util.List;
import java.util.UUID;

/**
 * Polled by every client. `robots` are the current (post-resolution) positions,
 * `round` is the round currently being programmed, and `lastResolution` is the
 * replay of the round that just finished (null before the first one).
 */
public record BoardStateDto(
        UUID gameId,
        int width,
        int height,
        List<RobotStateDto> robots,
        List<Tile> tiles,
        int round,
        List<String> lockedInPlayerIds,
        List<CheckpointProgressDto> checkpointProgress,
        WinnerDto winner,
        TurnResolutionDto lastResolution) {
}
