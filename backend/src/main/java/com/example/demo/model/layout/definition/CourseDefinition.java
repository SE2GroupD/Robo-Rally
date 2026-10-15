package com.example.demo.model.layout.definition;

import java.util.List;

public record CourseDefinition(String id, String name, List<BoardPlacement> boards, List<CheckpointPlacement> checkpoints) {

    public CourseDefinition {
        boards = List.copyOf(boards);
        checkpoints = List.copyOf(checkpoints);
    }
}
