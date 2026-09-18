package com.example.demo.dto;

import java.util.List;

/** Snapshot of every robot that had a card this register, after register N was applied. */
public record RegisterStepDto(int registerNumber, List<RobotStepDto> robots) {
}
