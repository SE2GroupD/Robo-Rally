package com.example.demo.dto;

import com.example.demo.model.Position;
import tools.jackson.core.JsonParser;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ValueDeserializer;
import tools.jackson.databind.annotation.JsonDeserialize;

/** Catalog selections include a map ID; legacy standalone boards send coordinates directly. */
@JsonDeserialize(using = SelectStartRequest.Deserializer.class)
public record SelectStartRequest(Position position, String mapId) {

    public static final class Deserializer extends ValueDeserializer<SelectStartRequest> {

        @Override
        public SelectStartRequest deserialize(JsonParser parser, DeserializationContext context) {
            JsonNode node = context.readTree(parser);
            if (!node.isObject()) {
                return context.reportInputMismatch(SelectStartRequest.class, "Start selection must be an object.");
            }

            var mapId = node.get("mapId");
            if (mapId != null && !mapId.isNull() && !mapId.isString()) {
                return context.reportInputMismatch(SelectStartRequest.class, "Map ID must be a string.");
            }

            var coordinates = node.has("position") ? node.get("position") : node.has("x") || node.has("y") ? node : null;
            Position position = null;
            if (coordinates != null && !coordinates.isNull()) {
                var x = coordinates.get("x");
                var y = coordinates.get("y");
                if (!isCoordinate(x) || !isCoordinate(y)) {
                    return context.reportInputMismatch(SelectStartRequest.class, "Start coordinates must be integer x and y values.");
                }
                position = new Position(x.intValue(), y.intValue());
            }

            return new SelectStartRequest(position, mapId == null || mapId.isNull() ? null : mapId.asString());
        }

        private static boolean isCoordinate(JsonNode value) {
            return value != null && value.isIntegralNumber() && value.canConvertToInt();
        }
    }
}
