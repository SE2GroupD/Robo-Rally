package com.example.demo.controller;

import com.example.demo.model.layout.MapLayout;
import com.example.demo.service.MapLayoutService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/maps")
public class MapLayoutController {

    private final MapLayoutService mapLayoutService;

    public MapLayoutController(MapLayoutService mapLayoutService) {
        this.mapLayoutService = mapLayoutService;
    }

    @GetMapping
    public java.util.List<MapLayout> getLayouts() {
        return mapLayoutService.getLayouts();
    }

    @GetMapping("/default")
    public MapLayout getDefaultLayout() {
        return mapLayoutService.getDefaultLayout();
    }
}
