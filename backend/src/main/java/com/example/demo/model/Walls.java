package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record Walls(
        @JsonProperty("north") boolean north,
        @JsonProperty("east") boolean east,
        @JsonProperty("south") boolean south,
        @JsonProperty("west") boolean west
) {
}
