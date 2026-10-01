package com.example.demo.dto;

import java.util.List;

/** Replay of one round: where robots started, then each register's result. */
public record TurnResolutionDto(int round, List<RobotStateDto> startingRobots, List<RegisterStepDto> steps) {
}
