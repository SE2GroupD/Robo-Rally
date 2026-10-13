package com.example.demo.model.layout;

import java.util.List;

public record MapLayout(String id, String name, List<PlacedBoard> boards) {

    public MapLayout(List<PlacedBoard> boards) {
        this(null, null, boards);
    }

    public MapLayout {
        boards = List.copyOf(boards);
    }
}
