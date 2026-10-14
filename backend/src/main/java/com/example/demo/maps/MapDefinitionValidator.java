package com.example.demo.maps;

import com.example.demo.model.Position;
import com.example.demo.model.layout.BoardKind;
import com.example.demo.model.layout.definition.BoardPlacement;
import com.example.demo.model.layout.definition.BoardTemplate;
import com.example.demo.model.layout.definition.CourseDefinition;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/** Checks resource definitions and references; geometry is validated after composition. */
public final class MapDefinitionValidator {

    public void validate(MapResourceLoader.LoadedCatalog loaded) {
        Map<String, BoardTemplate> templates = new HashMap<>();

        loaded.templates().forEach((source, template) -> {
            validateTemplate(source, template);

            require(templates.putIfAbsent(template.id(), template) == null, source, "Duplicate template ID: " + template.id());
            var expectedKind = loaded.catalog().startTemplates().contains(source) ? BoardKind.START : BoardKind.GAME;
            require(template.kind() == expectedKind, source, "Template " + template.id() + " has the wrong catalog kind.");
        });

        Set<String> courseIds = new HashSet<>();
        loaded.courses().forEach((source, course) -> {
            validateCourse(source, course, templates);
            require(courseIds.add(course.id()), source, "Duplicate course ID: " + course.id());
        });

        require(courseIds.contains(loaded.catalog().defaultMapId()), loaded.source(), "Default map must reference a registered course.");
    }

    private void validateTemplate(String source, BoardTemplate template) {
        require(nonempty(template.id()) && nonempty(template.name()), source, "Template needs an ID and name.");
        require(template.kind() != null, source, "Template " + template.id() + " needs a kind.");
        require(template.width() == template.kind().width() && template.height() == 10, source,
                "Template " + template.id() + " has invalid dimensions.");

        Set<Position> positions = new HashSet<>();
        int spawnCount = 0;

        for (var tile : template.tiles()) {
            require(inBounds(tile.x(), tile.y(), template), source, "Out-of-bounds tile in " + template.id());
            require(positions.add(new Position(tile.x(), tile.y())), source, "Duplicate tile in " + template.id());
            require(tile.checkpointNumber() == null, source, "Checkpoints belong to courses, not template " + template.id());
            require(tile.conveyor() == null || tile.conveyor().direction() != null, source, "Conveyor direction is required.");
            require(tile.pushPanel() == null || tile.pushPanel().direction() != null, source, "Push panel direction is required.");

            if (tile.isSpawnPoint()) {
                spawnCount++;
                require(template.kind() == BoardKind.START && !tile.hasPit(), source, "Spawn tiles must be on a start board without a pit.");
            }
        }

        require(template.kind() != BoardKind.START || spawnCount > 0, source, "Start template needs spawn tiles.");
    }

    private void validateCourse(String source, CourseDefinition course, Map<String, BoardTemplate> templates) {
        require(nonempty(course.id()) && nonempty(course.name()), source, "Course needs an ID and name.");
        Map<String, BoardPlacement> boards = new HashMap<>();

        for (var board : course.boards()) {
            require(nonempty(board.id()) && boards.putIfAbsent(board.id(), board) == null, source,
                    "Course " + course.id() + " needs unique nonempty board IDs.");
            require(templates.containsKey(board.templateId()), source, "Unknown template: " + board.templateId());
            require(board.x() != null && board.y() != null, source, "Board " + board.id() + " needs x and y.");
            require(board.rotation() != null && Set.of(0, 90, 180, 270).contains(board.rotation()), source,
                    "Invalid rotation for board " + board.id());
        }

        validateCheckpoints(source, course, boards, templates);
    }

    private void validateCheckpoints(String source, CourseDefinition course,
                                     Map<String, BoardPlacement> boards, Map<String, BoardTemplate> templates) {
        Set<Integer> numbers = new HashSet<>();
        Set<String> positions = new HashSet<>();

        for (var checkpoint : course.checkpoints()) {
            var board = boards.get(checkpoint.boardId());
            require(board != null, source, "Checkpoint references unknown board: " + checkpoint.boardId());
            var template = templates.get(board.templateId());

            require(template.kind() == BoardKind.GAME, source, "Checkpoints must be on game boards.");
            require(checkpoint.x() != null && checkpoint.y() != null
                    && inBounds(checkpoint.x(), checkpoint.y(), template), source, "Checkpoint is outside its board.");
            require(checkpoint.number() != null && checkpoint.number() > 0 && numbers.add(checkpoint.number()),
                    source, "Checkpoint numbers must be positive and unique.");
            require(positions.add(checkpoint.boardId() + ":" + checkpoint.x() + ":" + checkpoint.y()), source,
                    "Multiple checkpoints occupy the same tile.");
            require(template.tiles().stream().noneMatch(tile -> tile.x() == checkpoint.x() && tile.y() == checkpoint.y() && tile.hasPit()),
                    source, "Checkpoint cannot occupy a pit.");
        }

        require(!numbers.isEmpty(), source, "Course needs at least one checkpoint.");
        for (int number = 1; number <= numbers.size(); number++) {
            require(numbers.contains(number), source, "Checkpoint numbers must be consecutive from 1.");
        }
    }

    private boolean inBounds(int x, int y, BoardTemplate template) {
        return x >= 0 && x < template.width() && y >= 0 && y < template.height();
    }

    private boolean nonempty(String value) {
        return value != null && !value.isBlank();
    }

    private void require(boolean valid, String source, String message) {
        if (!valid) {
            throw new IllegalArgumentException(source + ": " + message);
        }
    }
}
