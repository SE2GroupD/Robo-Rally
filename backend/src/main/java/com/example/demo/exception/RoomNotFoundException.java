package com.example.demo.exception;

/** Thrown when a roomId doesn't correspond to any active game room. */
public class RoomNotFoundException extends RuntimeException {
    public RoomNotFoundException(String message) {
        super(message);
    }
}
