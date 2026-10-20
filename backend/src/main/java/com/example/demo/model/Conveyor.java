package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

// A conveyor belt tile. isExpress defaults to false (normal, 1-square belt) true means an express belt (2 squares belt)
@JsonIgnoreProperties(ignoreUnknown = true)
public record Conveyor(
        @JsonProperty("direction") Direction direction,
        @JsonProperty("isExpress") @JsonAlias({"isExpress", "express"}) boolean isExpress
) {

    public Conveyor(Direction direction) {
        this(direction, false);
    }
}
