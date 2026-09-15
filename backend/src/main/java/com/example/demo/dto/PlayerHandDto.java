package com.example.demo.dto;

import com.example.demo.model.CardType;
import java.util.List;

public record PlayerHandDto(
                String playerId,
                List<CardType> cards,
                int drawPileCount,
                int discardPileCount,
                List<CardType> lockedRegisters,
                boolean isLockedIn) {
}