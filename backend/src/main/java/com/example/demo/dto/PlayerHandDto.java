package com.example.demo.dto;

import com.example.demo.model.CardType;
import java.util.List;

public record PlayerHandDto(
        String playerId,
        List<CardType> cards,
        int drawPileCount,
        int discardPileCount) {
}
/*
 * Record automatically generates:
 * - private final String playerId;
 * - private final List<CardType> cards;
 * - public PlayerHandDto(String playerId, List<CardType> cards) { ... }
 * - public List<CardType> cards() { return cards; }
 * - public String playerId() { return playerId; }
 * - public boolean equals(Object o) { ... }
 */