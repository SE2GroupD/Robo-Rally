package com.example.demo.service;

import com.example.demo.dto.PlayerHandDto;
import com.example.demo.dto.ProgramRegisterDto;
import java.util.UUID;

public interface GameService {
    
    /**
     * Retrieves the 9 drawn cards for a specific player in a specific room.
     */
    PlayerHandDto getPlayerHand(UUID roomId, String playerId);

    /**
     * Processes the 5 registers submitted by a player, locking them in for the round.
     */
    void submitPlayerRegisters(UUID roomId, ProgramRegisterDto request);
}