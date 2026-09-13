package com.example.demo.service;

import com.example.demo.dto.BoardStateDto;
import com.example.demo.dto.PlayerHandDto;
import com.example.demo.dto.ProgramRegisterDto;
import com.example.demo.dto.RobotStateDto;

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
     * Places a robot for this player in the room (creating the room if it doesn't
     * exist yet).
     */
    RobotStateDto joinRoom(UUID roomId, String playerId);

    /**
     * Resolves the current round's movement once every robot in the room has
     * submitted registers.
     */
    BoardStateDto resolveTurn(UUID roomId);

    BoardStateDto getBoardState(UUID roomId);
}
