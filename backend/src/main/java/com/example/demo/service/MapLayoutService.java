package com.example.demo.service;

import com.example.demo.game.GameBoard;
import com.example.demo.maps.MapDefinitionValidator;
import com.example.demo.maps.MapLayoutAssembler;
import com.example.demo.maps.MapResourceLoader;
import com.example.demo.model.layout.MapLayout;
import com.example.demo.model.layout.definition.BoardTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class MapLayoutService {

    private final List<MapLayout> layouts;
    private final Map<String, MapLayout> layoutsById;
    private final String defaultMapId;

    public MapLayoutService() {
        this(new MapResourceLoader().load("map-catalog.json"));
    }

    public MapLayoutService(MapResourceLoader.LoadedCatalog definitions) {
        new MapDefinitionValidator().validate(definitions);

        var templates = new LinkedHashMap<String, BoardTemplate>();
        definitions.templates().values().forEach(template -> templates.put(template.id(), template));
        var assembled = new LinkedHashMap<String, MapLayout>();
        var assembler = new MapLayoutAssembler();

        definitions.courses().forEach((source, course) -> {
            try {
                var layout = assembler.assemble(course, templates);
                // Includes general layout validation and the current gameplay geometry limits.
                GameBoard.training(layout);
                assembled.put(layout.id(), layout);
            } catch (IllegalArgumentException exception) {
                throw new IllegalArgumentException(source + " (" + course.id() + "): " + exception.getMessage(), exception);
            }
        });

        layouts = List.copyOf(assembled.values());
        layoutsById = Map.copyOf(assembled);
        defaultMapId = definitions.catalog().defaultMapId();
    }

    public List<MapLayout> getLayouts() {
        return layouts;
    }

    public MapLayout getDefaultLayout() {
        return layoutsById.get(defaultMapId);
    }

    public MapLayout getLayout(String id) {
        var layout = id == null ? null : layoutsById.get(id);

        if (layout == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Map not found.");
        }

        return layout;
    }
}
