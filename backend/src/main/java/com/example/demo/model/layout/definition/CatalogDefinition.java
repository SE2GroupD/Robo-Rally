package com.example.demo.model.layout.definition;

import java.util.List;

public record CatalogDefinition(String defaultMapId, List<String> startTemplates, List<String> boardTemplates, List<String> courses) {

    public CatalogDefinition {
        startTemplates = List.copyOf(startTemplates);
        boardTemplates = List.copyOf(boardTemplates);
        courses = List.copyOf(courses);
    }
}
