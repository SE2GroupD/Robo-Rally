package com.example.demo.maps;

import com.example.demo.model.Tile;
import com.example.demo.model.layout.MapLayout;
import com.example.demo.model.layout.PlacedBoard;
import com.example.demo.model.layout.definition.BoardTemplate;
import com.example.demo.model.layout.definition.CourseDefinition;

import java.util.ArrayList;
import java.util.Map;

/** Composes validated definitions without modifying shared terrain. */
public final class MapLayoutAssembler {

    public MapLayout assemble(CourseDefinition course, Map<String, BoardTemplate> templates) {
        var boards = course.boards().stream().map(placement -> {
            var template = templates.get(placement.templateId());
            var tiles = new ArrayList<>(template.tiles());

            for (var checkpoint : course.checkpoints()) {
                if (!checkpoint.boardId().equals(placement.id())) {
                    continue;
                }

                var original = tiles.stream()
                        .filter(tile -> tile.x() == checkpoint.x() && tile.y() == checkpoint.y())
                        .findFirst().orElse(Tile.blank(checkpoint.x(), checkpoint.y()));
                var combined = withCheckpoint(original, checkpoint.number());
                int index = tiles.indexOf(original);

                if (index < 0) {
                    tiles.add(combined);
                } else {
                    tiles.set(index, combined);
                }
            }

            return new PlacedBoard(placement.id(), template.kind(), placement.x(), placement.y(),
                    placement.rotation(), tiles);
        }).toList();

        return new MapLayout(course.id(), course.name(), boards);
    }

    private Tile withCheckpoint(Tile tile, int number) {
        return new Tile(tile.x(), tile.y(), tile.hasPit(), tile.walls(), tile.hasAntenna(),
                tile.isSpawnPoint(), tile.gear(), tile.conveyor(), number, tile.pushPanel());
    }
}
