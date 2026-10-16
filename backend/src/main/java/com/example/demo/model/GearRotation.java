package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

public enum GearRotation {
    @JsonProperty("CLOCKWISE")
    CLOCKWISE,

    @JsonProperty("COUNTERCLOCKWISE")
    @JsonAlias({"COUNTERCLOCKWISE", "COUNTER_CLOCKWISE"})
    COUNTERCLOCKWISE
}
