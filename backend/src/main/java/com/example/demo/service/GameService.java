package com.example.demo.service;

import com.example.demo.dto.BoardStateDto;
import com.example.demo.dto.PlayerHandDto;
import com.example.demo.dto.ProgramRegisterDto;

import java.util.UUID;

public interface GameService {

    /** The player's current hand (dealt on first request each round). */
    PlayerHandDto getPlayerHand(UUID gameId, String playerId);

    /** Locks in the player's registers; resolves the round when the last player locks in. */
    void submitPlayerRegisters(UUID gameId, String playerId, ProgramRegisterDto request);

    /** Board, robots, lock-in status and the last round's replay. */
    BoardStateDto getBoardState(UUID gameId, String playerId);

    /** A non-host player left mid-game. */
    void removePlayer(UUID gameId, String playerId);

    /** The room closed. */
    void endGame(UUID gameId);
}
