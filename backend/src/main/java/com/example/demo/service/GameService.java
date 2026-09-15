package com.example.demo.service;

import com.example.demo.dto.BoardStateDto;
import com.example.demo.dto.PlayerHandDto;
import com.example.demo.dto.ProgramRegisterDto;
import com.example.demo.dto.RobotStateDto;
import com.example.demo.dto.TurnResolutionDto;

import java.util.UUID;

public interface GameService {

    /** Places a robot for this player in the room (creating the room if it doesn't exist yet). */
    RobotStateDto joinRoom(UUID roomId, String playerId);

    PlayerHandDto getPlayerHand(UUID roomId, String playerId);

    void submitPlayerRegisters(UUID roomId, ProgramRegisterDto registerDto);

    /**
     * Resolves the current round's movement once every robot in the room has
     * submitted registers. Returns the full step-by-step trace (a snapshot
     * after each of the 5 registers) so the frontend can animate the reveal
     * without re-implementing movement rules itself.
     */
    TurnResolutionDto resolveTurn(UUID roomId);

    BoardStateDto getBoardState(UUID roomId);
}
