package com.example.demo.service;

import com.example.demo.game.MapLayoutValidator;
import com.example.demo.model.layout.MapLayout;
import com.example.demo.model.layout.ExtraCrispy;
import org.springframework.stereotype.Service;

@Service
public class MapLayoutService {

    private final MapLayout defaultLayout;

    public MapLayoutService() {
        defaultLayout = ExtraCrispy.layout();

        MapLayoutValidator.requireValid(defaultLayout);
    }

    /** Canonical definition shared by the layout endpoint and new training games. */
    public MapLayout getDefaultLayout() {
        return defaultLayout;
    }
}
