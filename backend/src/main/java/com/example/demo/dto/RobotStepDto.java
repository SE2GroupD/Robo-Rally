package com.example.demo.dto;

import com.example.demo.model.CardType;
import com.example.demo.model.Direction;

/** One robot's card and resulting state after a single register was applied. */
public record RobotStepDto(String playerId, CardType cardPlayed, int x, int y, Direction direction) {
}
