package com.example.demo.dto;

import java.util.List;
import java.util.UUID;
import com.example.demo.model.Tile;

public record BoardStateDto(UUID roomId, int width, int height, List<RobotStateDto> robots, List<Tile> tiles) {
}
