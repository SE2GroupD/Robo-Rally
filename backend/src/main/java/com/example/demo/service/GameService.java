package com.example.demo.service;

import com.example.demo.dto.BoardStateDto;
import com.example.demo.dto.PlayerHandDto;
import com.example.demo.dto.ProgramRegisterDto;
import com.example.demo.dto.TurnResolutionDto;

import java.util.UUID;

public interface GameService {

    /** Retrieves the current hand of programming cards for a given player. */
    PlayerHandDto getPlayerHand(UUID roomId, String playerId);

    /** Submits a player's chosen sequence of programming registers. */
    void submitPlayerRegisters(UUID roomId, ProgramRegisterDto registerDto);

    /** Resolves a turn for all players in the room once registers are submitted. */
    TurnResolutionDto resolveTurn(UUID roomId);

    /** Retrieves the current state of the board and robot positions. */
    BoardStateDto getBoardState(UUID roomId);
}
