package com.example.demo.dto;

import java.util.List;

/** One register (1..5): its phases in order. Phases where nothing changed are omitted, except CARD. */
public record RegisterStepDto(int registerNumber, List<PhaseStepDto> phases) {
}
