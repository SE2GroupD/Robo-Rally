package com.example.demo.dto;

import java.util.List;

/** Everything that happened in one register (1..5). */
public record RegisterStepDto(int registerNumber, List<RobotStepDto> robots) {
}
