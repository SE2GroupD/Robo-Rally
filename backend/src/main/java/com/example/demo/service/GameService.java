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
      * Processes the 1 to 5 cards submitted by a player, locking them in for the
      * round.
      */
     void submitPlayerRegisters(UUID roomId, String playerId, ProgramRegisterDto request);

     /**
      * Completes the current round for a specific player in a specific room.
      */
     void completeRound(UUID roomId, String playerId);
}