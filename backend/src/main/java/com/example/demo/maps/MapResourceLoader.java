package com.example.demo.maps;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.example.demo.model.Conveyor;
import com.example.demo.model.Tile;
import com.example.demo.model.Walls;
import com.example.demo.model.layout.definition.BoardTemplate;
import com.example.demo.model.layout.definition.CatalogDefinition;
import com.example.demo.model.layout.definition.CourseDefinition;
import org.springframework.core.io.ClassPathResource;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Reads classpath streams, without assuming resources are ordinary files on disk. */
public final class MapResourceLoader {

    private final ClassLoader classLoader;
    private final JsonMapper mapper = JsonMapper.builder()
            .disable(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES)
            .disable(DeserializationFeature.ACCEPT_FLOAT_AS_INT)
            .enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
            .addMixIn(Tile.class, StrictResourceProperties.class)
            .addMixIn(Walls.class, StrictResourceProperties.class)
            .addMixIn(Conveyor.class, StrictResourceProperties.class)
            .build();

    /** Resource typos must fail without changing the shared models' legacy JSON compatibility. */
    @JsonIgnoreProperties(ignoreUnknown = false)
    private abstract static class StrictResourceProperties {
    }

    public MapResourceLoader() {
        this(MapResourceLoader.class.getClassLoader());
    }

    public MapResourceLoader(ClassLoader classLoader) {
        this.classLoader = classLoader;
    }

    public LoadedCatalog load(String catalogPath) {
        var catalog = read(catalogPath, CatalogDefinition.class);
        var templates = new LinkedHashMap<String, BoardTemplate>();

        templates.putAll(readAll(catalog.startTemplates(), BoardTemplate.class));
        for (var entry : readAll(catalog.boardTemplates(), BoardTemplate.class).entrySet()) {
            if (templates.putIfAbsent(entry.getKey(), entry.getValue()) != null) {
                throw new IllegalArgumentException(catalogPath + ": duplicate template resource " + entry.getKey());
            }
        }

        return new LoadedCatalog(catalogPath, catalog, templates, readAll(catalog.courses(), CourseDefinition.class));
    }

    private <T> Map<String, T> readAll(List<String> paths, Class<T> type) {
        var result = new LinkedHashMap<String, T>();

        for (String path : paths) {
            if (result.containsKey(path)) {
                throw new IllegalArgumentException("Duplicate resource: " + path);
            }

            result.put(path, read(path, type));
        }

        return result;
    }

    private <T> T read(String path, Class<T> type) {
        if (path == null || path.isBlank()) {
            throw new IllegalArgumentException("Resource path must be nonempty.");
        }

        try (var stream = new ClassPathResource(path, classLoader).getInputStream()) {
            JsonNode json = mapper.readTree(stream);
            requireIntegerFields(json);
            return mapper.treeToValue(json, type);
        } catch (IOException | RuntimeException exception) {
            throw new IllegalArgumentException(path + ": " + exception.getMessage(), exception);
        }
    }

    /** Tile booleans may be omitted; coordinates must never silently become zero or be truncated. */
    private void requireIntegerFields(JsonNode node) {
        if (node == null || node.isNull()) {
            throw new IllegalArgumentException("Definition must not be null.");
        }

        if (node.isArray()) {
            for (JsonNode element : node) {
                requireIntegerFields(element);
            }
        } else if (node.isObject()) {
            if (node.has("tiles")) {
                for (JsonNode tile : node.get("tiles")) {
                    requireInteger(tile.get("x"), "tile.x");
                    requireInteger(tile.get("y"), "tile.y");
                }
            }

            for (var property : node.properties()) {
                if (List.of("x", "y", "width", "height", "rotation", "number", "checkpointNumber").contains(property.getKey())) {
                    requireInteger(property.getValue(), property.getKey());
                } else if ((property.getValue().isArray() || property.getValue().isObject())) {
                    requireIntegerFields(property.getValue());
                }
            }
        }
    }

    private void requireInteger(JsonNode value, String field) {
        if (value == null || !value.isIntegralNumber() || !value.canConvertToInt()) {
            throw new IllegalArgumentException(field + " must be a 32-bit integer.");
        }
    }

    public record LoadedCatalog(
            String source,
            CatalogDefinition catalog,
            Map<String, BoardTemplate> templates,
            Map<String, CourseDefinition> courses) {

        public LoadedCatalog {
            templates = Collections.unmodifiableMap(new LinkedHashMap<>(templates));
            courses = Collections.unmodifiableMap(new LinkedHashMap<>(courses));
        }
    }
}
