package com.example.demo.dto;

import com.example.demo.model.CardType;
import java.util.List;

public record ProgramRegisterDto(
    String playerId,
    List<CardType> registers // The frontend will send 5 items
) {}

/*
 * Record automatically generates:
 * - private final String playerId;
 * - private final List<CardType> registers;
 * - public ProgramRegisterDto(String playerId, List<CardType> registers) { ... }
 * - public List<CardType> registers() { return registers; }
 * - public String playerId() { return playerId; }
 * - public boolean equals(Object o) { ... }
 */