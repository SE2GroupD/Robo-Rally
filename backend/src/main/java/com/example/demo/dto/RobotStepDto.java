package com.example.demo.dto;

import com.example.demo.model.CardType;
import com.example.demo.model.Direction;

/** One robot's card in one register, and where it ended up afterwards. */
public record RobotStepDto(String playerId, CardType card, int x, int y, Direction direction) {
}
