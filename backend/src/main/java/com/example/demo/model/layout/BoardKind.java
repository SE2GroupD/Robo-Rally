package com.example.demo.model.layout;

import com.fasterxml.jackson.annotation.JsonValue;

public enum BoardKind {
    START("start", 3),
    GAME("game", 10);

    private final String value;
    private final int width;

    BoardKind(String value, int width) {
        this.value = value;
        this.width = width;
    }

    @JsonValue
    public String value() {
        return value;
    }

    public int width() {
        return width;
    }
}
