package com.example.demo.dto;

import com.example.demo.model.Direction;

public record RobotStateDto(String playerId, int x, int y, Direction direction) {
}
