package com.example.demo.dto;

import java.util.List;

public record CheckpointProgressDto(
        String playerId,
        int nextCheckpoint,
        List<Integer> completedCheckpoints) {
}
