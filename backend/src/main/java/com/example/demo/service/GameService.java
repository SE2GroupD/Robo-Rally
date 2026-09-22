package com.example.demo.service;

import com.example.demo.dto.BoardStateDto;
import com.example.demo.dto.PlayerHandDto;
import com.example.demo.dto.ProgramRegisterDto;
import com.example.demo.dto.TurnResolutionDto;

import java.util.UUID;

public interface GameService {

    /**
     * Retrieves the 9 drawn cards for a specific player in a specific room.
     */
    PlayerHandDto getPlayerHand(UUID roomId, String playerId);

    /**
     * Processes the 5 registers submitted by a player, locking them in for the
     * round.
     */
    void submitPlayerRegisters(UUID roomId, String playerId, ProgramRegisterDto request);

    /**
     * Completes the current round for a specific player in a specific room.
     */
    void completeRound(UUID roomId, String playerId);

    /**
     * Resolves a turn for all players in the room once registers are submitted.
     */
    TurnResolutionDto resolveTurn(UUID roomId);

    /**
     * Retrieves the current state of the board and robot positions.
     */
    BoardStateDto getBoardState(UUID roomId);
}
