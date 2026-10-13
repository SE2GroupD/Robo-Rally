package com.example.demo.service;

import com.example.demo.game.GameBoard;
import com.example.demo.model.layout.MapLayout;
import com.example.demo.model.layout.ExtraCrispy;
import com.example.demo.model.layout.RiskyCrossing;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class MapLayoutService {

    // Add playable definitions here. The first entry is the default map.
    private final List<MapLayout> layouts = List.of(ExtraCrispy.layout(), RiskyCrossing.layout());

    public MapLayoutService() {
        // Validate both the layout and its supported gameplay geometry at startup.
        layouts.forEach(GameBoard::training);

        if (layouts.stream().anyMatch(layout -> layout.id() == null || layout.id().isBlank())
                || layouts.stream().map(MapLayout::id).distinct().count() != layouts.size()) {
            throw new IllegalArgumentException("Map IDs must be nonempty and unique.");
        }
    }

    public List<MapLayout> getLayouts() {
        return layouts;
    }

    public MapLayout getDefaultLayout() {
        return layouts.getFirst();
    }

    public MapLayout getLayout(String id) {
        return layouts.stream().filter(layout -> layout.id().equals(id)).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Map not found."));
    }
}
