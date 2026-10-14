package com.example.demo.maps;

import com.example.demo.model.*;
import com.example.demo.model.layout.BoardKind;
import com.example.demo.model.layout.definition.*;
import com.example.demo.service.MapLayoutService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.net.URLClassLoader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.jar.JarEntry;
import java.util.jar.JarOutputStream;

import static org.junit.jupiter.api.Assertions.*;

class MapResourceTests {

    @TempDir
    Path directory;

    private final MapResourceLoader loader = new MapResourceLoader();

    @Test
    void readsCatalogFromAJarWithoutFilesystemResources() throws Exception {
        var definitions = loader.load("map-catalog.json");
        var paths = new java.util.ArrayList<>(List.of("map-catalog.json"));
        paths.addAll(definitions.templates().keySet());
        paths.addAll(definitions.courses().keySet());
        var jar = directory.resolve("definitions.jar");

        try (var output = new JarOutputStream(Files.newOutputStream(jar))) {
            for (var path : paths) {
                output.putNextEntry(new JarEntry(path));
                try (var input = getClass().getClassLoader().getResourceAsStream(path)) {
                    assertNotNull(input);
                    input.transferTo(output);
                }
                output.closeEntry();
            }
        }

        try (var isolated = new URLClassLoader(new java.net.URL[]{jar.toUri().toURL()}, null)) {
            var service = new MapLayoutService(new MapResourceLoader(isolated).load("map-catalog.json"));
            assertEquals(new MapLayoutService().getLayouts(), service.getLayouts());
            assertEquals(List.of("extra-crispy", "risky-crossing", "burnout"), service.getLayouts().stream().map(layout -> layout.id()).toList());
        }
    }

    @Test
    void missingAndMalformedResourcesIdentifyTheirFile() throws Exception {
        assertTrue(assertThrows(IllegalArgumentException.class, () -> loader.load("missing.json")).getMessage().contains("missing.json"));
        Files.writeString(directory.resolve("broken.json"), "{ broken");

        try (var isolated = new URLClassLoader(new java.net.URL[]{directory.toUri().toURL()}, null)) {
            assertTrue(assertThrows(IllegalArgumentException.class,
                    () -> new MapResourceLoader(isolated).load("broken.json")).getMessage().contains("broken.json"));
        }
    }

    @Test
    void rejectsMissingFractionalAndStringTileCoordinates() throws Exception {
        Files.writeString(directory.resolve("catalog.json"), """
                {"defaultMapId":"test","startTemplates":[],"boardTemplates":["board.json"],"courses":[]}
                """);

        try (var isolated = new URLClassLoader(new java.net.URL[]{directory.toUri().toURL()}, null)) {
            for (var coordinates : List.of("\"y\":0", "\"x\":0.5,\"y\":0", "\"x\":\"1\",\"y\":0")) {
                Files.writeString(directory.resolve("board.json"), "{\"id\":\"test\",\"name\":\"Test\",\"kind\":\"game\",\"width\":10,\"height\":10,\"tiles\":[{" + coordinates + "}]}");
                assertTrue(assertThrows(IllegalArgumentException.class,
                        () -> new MapResourceLoader(isolated).load("catalog.json")).getMessage().contains("board.json"));
            }
        }
    }

    @Test
    void rejectsDuplicateIdsUnknownReferencesAndInvalidCoordinates() {
        var loaded = loader.load("map-catalog.json");
        var source = "racingcourses/extra-crispy.json";
        var original = loaded.courses().get(source);
        var start = original.boards().getFirst();
        var game = original.boards().getLast();

        for (var invalid : List.of(
                new CourseDefinition(original.id(), original.name(), List.of(start, start), original.checkpoints()),
                new CourseDefinition(original.id(), original.name(), List.of(start,
                        new BoardPlacement(game.id(), "unknown", 3, 0, 0)), original.checkpoints()),
                new CourseDefinition(original.id(), original.name(), original.boards(), List.of(new CheckpointPlacement(game.id(), 10, 0, 1))),
                new CourseDefinition(original.id(), original.name(), original.boards(), List.of(new CheckpointPlacement("unknown", 0, 0, 1))),
                new CourseDefinition(original.id(), original.name(), original.boards(), List.of(
                        new CheckpointPlacement(game.id(), 0, 0, 1), new CheckpointPlacement(game.id(), 1, 0, 1))))) {
            var courses = new LinkedHashMap<>(loaded.courses());
            courses.put(source, invalid);
            assertInvalid(new MapResourceLoader.LoadedCatalog(loaded.source(), loaded.catalog(), loaded.templates(), courses), source);
        }

        var duplicateCourses = new LinkedHashMap<>(loaded.courses());
        duplicateCourses.put("duplicate.json", original);
        assertInvalid(new MapResourceLoader.LoadedCatalog(loaded.source(), loaded.catalog(), loaded.templates(), duplicateCourses), "duplicate.json");

        var templateSource = "boardtemplates/4a.json";
        for (var invalid : List.of(
                new BoardTemplate("4a", "4A", BoardKind.GAME, 9, 10, List.of()),
                new BoardTemplate("4a", "4A", BoardKind.GAME, 10, 10, List.of(Tile.blank(-1, 0))),
                new BoardTemplate("4a", "4A", BoardKind.GAME, 10, 10, List.of(Tile.blank(0, 0), Tile.blank(0, 0))),
                new BoardTemplate("4a", "4A", BoardKind.GAME, 10, 10, List.of(Tile.checkpoint(0, 0, 1))))) {
            var templates = new LinkedHashMap<>(loaded.templates());
            templates.put(templateSource, invalid);
            assertInvalid(new MapResourceLoader.LoadedCatalog(loaded.source(), loaded.catalog(), templates, loaded.courses()), templateSource);
        }

        var duplicateTemplates = new LinkedHashMap<>(loaded.templates());
        duplicateTemplates.put("duplicate.json", loaded.templates().get(templateSource));
        assertInvalid(new MapResourceLoader.LoadedCatalog(loaded.source(), loaded.catalog(), duplicateTemplates, loaded.courses()), "duplicate.json");
    }

    @Test
    void checkpointsOverlayTerrainWithoutMutatingSharedTemplatesOrLocalDirections() {
        var terrain = new Tile(1, 2, false, new Walls(true, false, false, false), false, false,
                GearRotation.CLOCKWISE, new Conveyor(Direction.EAST, false), null, null);
        var template = new BoardTemplate("shared", "Shared", BoardKind.GAME, 10, 10, List.of(terrain));
        var assembler = new MapLayoutAssembler();

        for (int rotation : List.of(0, 90, 180, 270)) {
            var course = new CourseDefinition("course-" + rotation, "Course",
                    List.of(new BoardPlacement("board", "shared", -10, 0, rotation)),
                    List.of(new CheckpointPlacement("board", 1, 2, 1)));
            var placed = assembler.assemble(course, Map.of("shared", template)).boards().getFirst();
            var combined = placed.tiles().getFirst();

            assertEquals(rotation, placed.rotation());
            assertEquals(1, combined.checkpointNumber());
            assertEquals(terrain.walls(), combined.walls());
            assertEquals(terrain.conveyor(), combined.conveyor());
            assertEquals(terrain.gear(), combined.gear());
            assertEquals(new Position(1, 2), new Position(combined.x(), combined.y()));
            assertEquals(List.of(terrain), template.tiles());
            assertNull(template.tiles().getFirst().checkpointNumber());
        }
    }

    private void assertInvalid(MapResourceLoader.LoadedCatalog definitions, String source) {
        var error = assertThrows(IllegalArgumentException.class, () -> new MapDefinitionValidator().validate(definitions));
        assertTrue(error.getMessage().contains(source), error.getMessage());
    }
}
