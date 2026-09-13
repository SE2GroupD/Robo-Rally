package com.example.demo.dto;

import java.util.List;
import java.util.UUID;

public record BoardStateDto(UUID roomId, int width, int height, List<RobotStateDto> robots) {
}
