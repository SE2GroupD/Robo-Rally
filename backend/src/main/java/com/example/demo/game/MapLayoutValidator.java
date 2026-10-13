package com.example.demo.game;

import com.example.demo.model.Direction;
import com.example.demo.model.Position;
import com.example.demo.model.layout.BoardKind;
import com.example.demo.model.layout.MapLayout;
import com.example.demo.model.layout.PlacedBoard;
import com.example.demo.model.layout.StartBoardTemplate;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Validates definitions independently of HTTP and live game sessions. */
public final class MapLayoutValidator {

    private MapLayoutValidator() {
    }

    public static List<String> validate(MapLayout layout) {
        List<String> errors = new ArrayList<>();
        var boards = layout.boards();

        if (boards.stream().filter(board -> board.kind() == BoardKind.START).count() != 1) {
            errors.add("Exactly one start board is required.");
        }
        if (boards.stream().noneMatch(board -> board.kind() == BoardKind.GAME)) {
            errors.add("At least one game board is required.");
        }

        Set<String> ids = new HashSet<>();

        for (var board : boards) {
            if (board.id() == null || board.id().isBlank() || !ids.add(board.id())) {
                errors.add("Board IDs must be nonempty and unique.");
            }
            if (board.kind() == null) {
                errors.add("Board kind is required.");
                continue;
            }
            if (board.rotation() != 0 && board.rotation() != 90 && board.rotation() != 180 && board.rotation() != 270) {
                errors.add("Board " + board.id() + " has an invalid rotation.");
            }

            if (board.kind() == BoardKind.START
                    && !new HashSet<>(board.tiles()).equals(new HashSet<>(StartBoardTemplate.tiles()))) {
                errors.add("Start board must match the permanent template.");
            }

            Set<Position> positions = new HashSet<>();

            for (var tile : board.tiles()) {
                if (tile.x() < 0 || tile.x() >= board.kind().width() || tile.y() < 0 || tile.y() >= 10
                        || !positions.add(new Position(tile.x(), tile.y()))) {
                    errors.add("Board " + board.id() + " has an invalid or duplicate tile position.");
                }
            }
        }

        if (!errors.isEmpty()) {
            return List.copyOf(errors);
        }

        List<Set<Integer>> connections = new ArrayList<>();
        int startIndex = 0;

        for (int i = 0; i < boards.size(); i++) {
            connections.add(new HashSet<>());
            if (boards.get(i).kind() == BoardKind.START) {
                startIndex = i;
            }
        }

        for (int i = 0; i < boards.size(); i++) {
            for (int j = i + 1; j < boards.size(); j++) {
                var a = boards.get(i);
                var b = boards.get(j);
                var first = bounds(a);
                var second = bounds(b);

                if (overlap(first.left(), first.right(), second.left(), second.right())
                        && overlap(first.top(), first.bottom(), second.top(), second.bottom())) {
                    errors.add("Boards " + a.id() + " and " + b.id() + " overlap.");
                }
                if (contactSide(a, b) == null) {
                    continue;
                }

                var start = a.kind() == BoardKind.START ? a : b.kind() == BoardKind.START ? b : null;

                if (start != null && contactSide(start, start == a ? b : a) != exitDirection(start)) {
                    errors.add("The start board can connect only along its exit edge.");
                    continue;
                }

                connections.get(i).add(j);
                connections.get(j).add(i);
            }
        }

        if (connections.get(startIndex).isEmpty()) {
            errors.add("A game board must connect to the start board exit.");
        }

        Set<Integer> visited = new HashSet<>();
        var pending = new ArrayDeque<Integer>();
        pending.add(startIndex);

        while (!pending.isEmpty()) {
            int index = pending.removeFirst();
            if (visited.add(index)) {
                pending.addAll(connections.get(index));
            }
        }

        if (visited.size() != boards.size()) {
            errors.add("All boards must form one edge-connected map.");
        }

        return List.copyOf(errors);
    }

    public static void requireValid(MapLayout layout) {
        var errors = validate(layout);

        if (!errors.isEmpty()) {
            throw new IllegalArgumentException(String.join(" ", errors));
        }
    }

    private static Direction exitDirection(PlacedBoard start) {
        return switch (start.rotation()) {
            case 0 -> Direction.EAST;
            case 90 -> Direction.SOUTH;
            case 180 -> Direction.WEST;
            case 270 -> Direction.NORTH;
            default -> throw new IllegalArgumentException("Invalid rotation.");
        };
    }

    private static Direction contactSide(PlacedBoard a, PlacedBoard b) {
        var first = bounds(a);
        var second = bounds(b);
        boolean vertical = overlap(first.top(), first.bottom(), second.top(), second.bottom());
        boolean horizontal = overlap(first.left(), first.right(), second.left(), second.right());

        if (vertical && first.right() == second.left()) return Direction.EAST;
        if (vertical && first.left() == second.right()) return Direction.WEST;
        if (horizontal && first.bottom() == second.top()) return Direction.SOUTH;
        if (horizontal && first.top() == second.bottom()) return Direction.NORTH;

        return null;
    }

    private static boolean overlap(long startA, long endA, long startB, long endB) {
        return Math.min(endA, endB) > Math.max(startA, startB);
    }

    private static Bounds bounds(PlacedBoard board) {
        boolean sideways = board.rotation() == 90 || board.rotation() == 270;
        int width = sideways ? 10 : board.kind().width();
        int height = sideways ? board.kind().width() : 10;

        // Use long for edges so valid integer positions cannot overflow during validation.
        return new Bounds(board.x(), board.y(), (long) board.x() + width, (long) board.y() + height);
    }

    private record Bounds(long left, long top, long right, long bottom) {
    }
}
