package com.example.demo.dto;

import java.util.List;
import java.util.UUID;

/**
 * The full, authoritative result of resolving one round: a snapshot after
 * each of the 5 registers, computed entirely server-side. The frontend
 * should treat this as a script to animate/play back - it should not need
 * to re-derive or double-check any of these positions itself.
 */
public record TurnResolutionDto(UUID roomId, int width, int height, List<RegisterStepDto> steps) {
}
