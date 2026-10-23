package com.example.demo.exception;

/**
 * Thrown when a request acts on behalf of a playerId that has no robot in
 * the room - i.e. they never called /join. Deliberately distinct from
 * RoomNotFoundException: the room is fine, this specific player just isn't
 * a participant in it. Callers should NOT respond to this by silently
 * creating a robot - that would let anyone join any room just by guessing
 * a playerId on the wrong endpoint.
 */
public class PlayerNotInRoomException extends RuntimeException {
    public PlayerNotInRoomException(String message) {
        super(message);
    }
}
