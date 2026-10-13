package com.example.demo.game;

import com.example.demo.model.CardType;
import com.example.demo.model.Conveyor;
import com.example.demo.model.Direction;
import com.example.demo.model.Position;
import com.example.demo.model.PushPanel;
import com.example.demo.model.ResolutionPhase;
import com.example.demo.model.Tile;
import com.example.demo.model.Walls;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MovementResolverTest {

    record Trace(int register, ResolutionPhase phase, Map<String, Position> positions) {}

    private final MovementResolver resolver = new MovementResolver();

    private static GameBoard board(int width, int height, Tile... tiles) {
        return new GameBoard(width, height, List.of(tiles), List.of());
    }

    private static Tile belt(int x, int y, Direction d) {
        return Tile.conveyorTile(x, y, new Conveyor(d));
    }

    private static Tile express(int x, int y, Direction d) {
        return Tile.conveyorTile(x, y, new Conveyor(d, true));
    }

    private static Robot robot(String id, int x, int y, Direction d) {
        return new Robot(id, new Position(x, y), d);
    }

    /** Five registers: the given cards, padded with POWER_UP (which does nothing). */
    private static List<CardType> program(CardType... cards) {
        List<CardType> list = new ArrayList<>(Arrays.asList(cards));
        while (list.size() < 5) list.add(CardType.POWER_UP);
        return list;
    }

    private static Map<Robot, List<CardType>> programs(Robot... robots) {
        Map<Robot, List<CardType>> map = new LinkedHashMap<>();
        for (Robot r : robots) map.put(r, program());
        return map;
    }

    private List<Trace> run(GameBoard board, Map<Robot, List<CardType>> programs) {
        List<Trace> traces = new ArrayList<>();
        resolver.resolveRound(board, programs, (n, phase, cards) -> {
            Map<String, Position> positions = new HashMap<>();
            programs.keySet().forEach(r -> positions.put(r.getPlayerId(), r.getPosition()));
            traces.add(new Trace(n, phase, positions));
        });
        return traces;
    }

    private static Position at(List<Trace> traces, int register, ResolutionPhase phase, String id) {
        return traces.stream()
                .filter(t -> t.register() == register && t.phase() == phase)
                .findFirst().orElseThrow().positions().get(id);
    }

    private static Position pos(int x, int y) {
        return new Position(x, y);
    }

    // ---- belts ----

    @Test
    void regularBeltIsIgnoredByTheExpressPhaseAndMovesOneTile() {
        Robot a = robot("A", 1, 0, Direction.NORTH);
        List<Trace> t = run(board(6, 3, belt(1, 0, Direction.EAST)), programs(a));
        assertEquals(pos(1, 0), at(t, 1, ResolutionPhase.EXPRESS_BELT, "A"));
        assertEquals(pos(2, 0), at(t, 1, ResolutionPhase.BELT, "A"));
        assertEquals(pos(2, 0), a.getPosition());
    }

    @Test
    void expressBeltMovesTwoTilesInOneRegister() {
        Robot a = robot("A", 1, 0, Direction.NORTH);
        GameBoard b = board(7, 3, express(1, 0, Direction.EAST), express(2, 0, Direction.EAST), express(3, 0, Direction.EAST));
        List<Trace> t = run(b, programs(a));
        assertEquals(pos(2, 0), at(t, 1, ResolutionPhase.EXPRESS_BELT, "A"));
        assertEquals(pos(3, 0), at(t, 1, ResolutionPhase.BELT, "A"));
    }

    @Test
    void cardMovementIsFollowedByTheBeltInTheSameRegister() {
        Robot a = robot("A", 0, 0, Direction.EAST);
        Map<Robot, List<CardType>> p = new LinkedHashMap<>();
        p.put(a, program(CardType.MOVE_1));
        List<Trace> t = run(board(6, 3, belt(1, 0, Direction.EAST)), p);
        assertEquals(pos(1, 0), at(t, 1, ResolutionPhase.CARD, "A"));
        assertEquals(pos(2, 0), at(t, 1, ResolutionPhase.BELT, "A"));
    }

    @Test
    void beltBendingRightTurnsTheRobotRight() {
        Robot a = robot("A", 1, 0, Direction.EAST);
        run(board(5, 4, belt(1, 0, Direction.EAST), belt(2, 0, Direction.SOUTH)), programs(a));
        assertEquals(Direction.SOUTH, a.getDirection());
        assertEquals(pos(2, 1), a.getPosition()); // carried on by the south belt next register
    }

    @Test
    void beltBendingLeftTurnsTheRobotLeft() {
        Robot a = robot("A", 1, 2, Direction.EAST);
        run(board(5, 4, belt(1, 2, Direction.EAST), belt(2, 2, Direction.NORTH)), programs(a));
        assertEquals(Direction.NORTH, a.getDirection());
        assertEquals(pos(2, 1), a.getPosition());
    }

    @Test
    void straightBeltDoesNotTurnTheRobot() {
        Robot a = robot("A", 1, 0, Direction.NORTH);
        run(board(6, 3, belt(1, 0, Direction.EAST), belt(2, 0, Direction.EAST)), programs(a));
        assertEquals(Direction.NORTH, a.getDirection());
    }

    @Test
    void beltAtTheBoardEdgeLeavesTheRobotInPlace() {
        Robot a = robot("A", 2, 0, Direction.EAST);
        run(board(3, 3, belt(2, 0, Direction.EAST)), programs(a));
        assertEquals(pos(2, 0), a.getPosition());
    }

    // ---- belt conflicts ----

    @Test
    void robotsCarriedOntoTheSameTileBothStay() {
        Robot a = robot("A", 1, 1, Direction.NORTH);
        Robot b = robot("B", 3, 1, Direction.NORTH);
        run(board(5, 3, belt(1, 1, Direction.EAST), belt(3, 1, Direction.WEST)), programs(a, b));
        assertEquals(pos(1, 1), a.getPosition());
        assertEquals(pos(3, 1), b.getPosition());
    }

    @Test
    void robotIsBlockedByAStationaryRobotAhead() {
        Robot a = robot("A", 1, 0, Direction.NORTH);
        Robot b = robot("B", 2, 0, Direction.NORTH);
        run(board(5, 3, belt(1, 0, Direction.EAST)), programs(a, b));
        assertEquals(pos(1, 0), a.getPosition());
        assertEquals(pos(2, 0), b.getPosition());
    }

    @Test
    void robotsFollowingEachOtherAlongABeltMoveTogether() {
        Robot a = robot("A", 1, 0, Direction.NORTH);
        Robot b = robot("B", 2, 0, Direction.NORTH);
        List<Trace> t = run(board(6, 3, belt(1, 0, Direction.EAST), belt(2, 0, Direction.EAST)), programs(a, b));
        assertEquals(pos(2, 0), at(t, 1, ResolutionPhase.BELT, "A"));
        assertEquals(pos(3, 0), at(t, 1, ResolutionPhase.BELT, "B"));
    }

    @Test
    void robotsThatWouldSwapPlacesStay() {
        Robot a = robot("A", 1, 0, Direction.NORTH);
        Robot b = robot("B", 2, 0, Direction.NORTH);
        run(board(5, 3, belt(1, 0, Direction.EAST), belt(2, 0, Direction.WEST)), programs(a, b));
        assertEquals(pos(1, 0), a.getPosition());
        assertEquals(pos(2, 0), b.getPosition());
    }

    // ---- push panels ----

    @Test
    void pushPanelOnlyPushesInItsActiveRegisters() {
        Robot a = robot("A", 1, 1, Direction.NORTH);
        GameBoard b = board(5, 3, Tile.pushPanelTile(1, 1, new PushPanel(Direction.EAST, List.of(2, 4))));
        List<Trace> t = run(b, programs(a));
        assertEquals(pos(1, 1), at(t, 1, ResolutionPhase.PUSH_PANEL, "A"));
        assertEquals(pos(2, 1), at(t, 2, ResolutionPhase.PUSH_PANEL, "A"));
        assertEquals(pos(2, 1), a.getPosition()); // no panel on the next tile
    }

    @Test
    void pushPanelAtTheBoardEdgeLeavesTheRobotInPlace() {
        Robot a = robot("A", 0, 0, Direction.EAST);
        GameBoard b = board(3, 3, Tile.pushPanelTile(0, 0, new PushPanel(Direction.NORTH, List.of(1, 2, 3, 4, 5))));
        run(b, programs(a));
        assertEquals(pos(0, 0), a.getPosition());
    }

    // ---- AGAIN ----

    @Test
    void againRepeatsThePreviousRegister() {
        Robot a = robot("A", 0, 0, Direction.EAST);
        Map<Robot, List<CardType>> p = new LinkedHashMap<>();
        p.put(a, program(CardType.MOVE_1, CardType.AGAIN));
        run(board(6, 1), p);
        assertEquals(pos(2, 0), a.getPosition());
    }

    @Test
    void againInTheFirstRegisterDoesNothing() {
        Robot a = robot("A", 0, 0, Direction.EAST);
        Map<Robot, List<CardType>> p = new LinkedHashMap<>();
        p.put(a, program(CardType.AGAIN, CardType.MOVE_1));
        run(board(6, 1), p);
        assertEquals(pos(1, 0), a.getPosition());
    }

    // ---- walls ----

    private static Tile wall(int x, int y, boolean n, boolean e, boolean s, boolean w) {
        return Tile.withWalls(x, y, new Walls(n, e, s, w));
    }

    @Test
    void wallOnTheNextTileBlocksABelt() {
        Robot a = robot("A", 1, 0, Direction.NORTH);
        run(board(5, 3, belt(1, 0, Direction.EAST), wall(2, 0, false, false, false, true)), programs(a));
        assertEquals(pos(1, 0), a.getPosition());
    }

    @Test
    void wallOnTheBeltTileBlocksIt() {
        Robot a = robot("A", 1, 0, Direction.NORTH);
        Tile beltWithWall = new Tile(1, 0, false, new Walls(false, true, false, false), false, false,
                null, new Conveyor(Direction.EAST), null, null);
        run(board(5, 3, beltWithWall), programs(a));
        assertEquals(pos(1, 0), a.getPosition());
    }

    @Test
    void wallBlocksPushPanel() {
        Robot a = robot("A", 1, 1, Direction.NORTH);
        Tile panelWithWall = new Tile(1, 1, false, new Walls(false, true, false, false), false, false,
                null, null, null, new PushPanel(Direction.EAST, List.of(1, 2, 3, 4, 5)));
        run(board(5, 3, panelWithWall), programs(a));
        assertEquals(pos(1, 1), a.getPosition());
    }

    @Test
    void wallStopsCardMovementAndLosesTheRemainingSpaces() {
        Robot a = robot("A", 0, 0, Direction.EAST);
        Map<Robot, List<CardType>> p = new LinkedHashMap<>();
        p.put(a, program(CardType.MOVE_3));
        run(board(6, 1, wall(2, 0, false, true, false, false)), p);
        assertEquals(pos(2, 0), a.getPosition());
    }

    // ---- robot pushing ----

    private Map<Robot, List<CardType>> moving(Robot mover, CardType card, Robot... others) {
        Map<Robot, List<CardType>> p = new LinkedHashMap<>();
        p.put(mover, program(card));
        for (Robot o : others) p.put(o, program());
        return p;
    }

    @Test
    void movingIntoARobotPushesIt() {
        Robot a = robot("A", 0, 0, Direction.EAST);
        Robot b = robot("B", 1, 0, Direction.NORTH);
        run(board(5, 1), moving(a, CardType.MOVE_1, b));
        assertEquals(pos(1, 0), a.getPosition());
        assertEquals(pos(2, 0), b.getPosition());
        assertEquals(Direction.NORTH, b.getDirection());
    }

    @Test
    void pushingAChainMovesEveryRobotInIt() {
        Robot a = robot("A", 0, 0, Direction.EAST);
        Robot b = robot("B", 1, 0, Direction.EAST);
        Robot c = robot("C", 2, 0, Direction.EAST);
        run(board(5, 1), moving(a, CardType.MOVE_1, b, c));
        assertEquals(pos(1, 0), a.getPosition());
        assertEquals(pos(2, 0), b.getPosition());
        assertEquals(pos(3, 0), c.getPosition());
    }

    @Test
    void moveTwoPushesTheRobotTwoTiles() {
        Robot a = robot("A", 0, 0, Direction.EAST);
        Robot b = robot("B", 1, 0, Direction.EAST);
        run(board(5, 1), moving(a, CardType.MOVE_2, b));
        assertEquals(pos(2, 0), a.getPosition());
        assertEquals(pos(3, 0), b.getPosition());
    }

    @Test
    void pushingARobotIntoAWallMovesNobody() {
        Robot a = robot("A", 0, 0, Direction.EAST);
        Robot b = robot("B", 1, 0, Direction.EAST);
        run(board(5, 1, wall(1, 0, false, true, false, false)), moving(a, CardType.MOVE_1, b));
        assertEquals(pos(0, 0), a.getPosition());
        assertEquals(pos(1, 0), b.getPosition());
    }

    @Test
    void pushingAChainIntoTheBoardEdgeMovesNobody() {
        Robot a = robot("A", 0, 0, Direction.EAST);
        Robot b = robot("B", 1, 0, Direction.EAST);
        Robot c = robot("C", 2, 0, Direction.EAST);
        run(board(3, 1), moving(a, CardType.MOVE_1, b, c));
        assertEquals(pos(0, 0), a.getPosition());
        assertEquals(pos(1, 0), b.getPosition());
        assertEquals(pos(2, 0), c.getPosition());
    }

    @Test
    void backingUpPushesARobotBehind() {
        Robot a = robot("A", 2, 0, Direction.EAST);
        Robot b = robot("B", 1, 0, Direction.EAST);
        run(board(5, 1), moving(a, CardType.BACK_UP, b));
        assertEquals(pos(1, 0), a.getPosition());
        assertEquals(pos(0, 0), b.getPosition());
    }
}
