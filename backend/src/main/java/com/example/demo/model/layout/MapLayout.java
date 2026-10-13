package com.example.demo.model.layout;

import java.util.List;

public record MapLayout(List<PlacedBoard> boards) {

    public MapLayout {
        boards = List.copyOf(boards);
    }
}
