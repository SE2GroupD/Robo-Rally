package com.example.demo.model;

import java.util.List;

/** Pushes a robot standing on it one tile in {@code direction}, in the listed registers (1-5). */
public record PushPanel(Direction direction, List<Integer> activeRegisters) {
    public PushPanel {
        activeRegisters = List.copyOf(activeRegisters);
    }

    public boolean isActiveIn(int registerNumber) {
        return activeRegisters.contains(registerNumber);
    }
}
