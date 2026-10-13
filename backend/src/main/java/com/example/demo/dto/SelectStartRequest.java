package com.example.demo.dto;

import com.example.demo.model.Position;
import tools.jackson.core.JsonParser;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ValueDeserializer;
import tools.jackson.databind.annotation.JsonDeserialize;

/** Null clears the reservation and opts into automatic assignment. */
public record SelectStartRequest(
        @JsonDeserialize(using = StartPositionDeserializer.class) Position position,
        String mapId) {

    /** Validate the wire coordinates before Jackson can truncate them to integers. */
    public static final class StartPositionDeserializer extends ValueDeserializer<Position> {

        @Override
        public Position deserialize(JsonParser parser, DeserializationContext context) {
            JsonNode node = context.readTree(parser);
            JsonNode x = node.get("x");
            JsonNode y = node.get("y");

            if (!isCoordinate(x) || !isCoordinate(y)) {
                return context.reportInputMismatch(Position.class, "Start coordinates must be integer x and y values.");
            }

            return new Position(x.intValue(), y.intValue());
        }

        private static boolean isCoordinate(JsonNode value) {
            return value != null && value.isIntegralNumber() && value.canConvertToInt();
        }
    }
}
