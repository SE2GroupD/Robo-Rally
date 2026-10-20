package com.example.demo.dto;

import com.example.demo.model.ResolutionPhase;

import java.util.List;

/** Every robot's state right after one phase of a register. `card` is only set in the CARD phase. */
public record PhaseStepDto(ResolutionPhase phase, List<RobotStepDto> robots) {
}
