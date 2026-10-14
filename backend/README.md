# Backend map layout preview

`GET /api/maps/default` returns a static board layout compatible with the frontend's `MapLayoutData`. It requires the existing bearer-token authentication. It does not require a room, create a game session, or change any live game.

The response contains `id` (`extra-crispy`), `name` (`Extra Crispy`), and `boards`. Each board has:

| Field | Meaning |
| --- | --- |
| `id` | Unique, nonempty board instance ID |
| `kind` | `start` (3 × 10 tiles) or `game` (10 × 10 tiles) |
| `x`, `y` | Integer top-left position of the rotated block in map tile coordinates; negative positions are supported |
| `rotation` | Clockwise degrees: `0`, `90`, `180`, or `270` |
| `tiles` | Special tiles, with coordinates and directions local to the unrotated board |

Tile fields reuse the existing `Tile` JSON contract. Unset optional properties are omitted; boolean flags are included. Missing tile positions inside a board represent ordinary floor. Spaces outside placed boards are not floor tiles.

The default is Extra Crispy, with an unrotated start board at `(0, 0)` and game board 4A at `(3, 0)`. The source is the user-supplied 4A image, oriented with its label upside down at the top-left. Coordinates below are 1-based and local to each board; code stores zero-based coordinates.

The permanent start template has spawn points at `(2,2)`, `(1,4)`, `(2,5)`, `(2,6)`, `(1,7)`, `(2,9)` in that order. Its walls are north at `(2,3)`, east at `(3,5)` and `(3,6)`, and south at `(2,8)`. Start A (`start-a`) also contains ordinary eastbound conveyors at `(3,1)` and `(3,10)`. Exact template contents and spawn order are covered by tests; the general layout validator allows other start templates.

Game-board checkpoints are 1 at `(8,3)`, 2 at `(3,8)`, 3 at `(8,8)`, and 4 at `(3,3)`. Pits occupy columns 4 and 7 in rows 3, 4, 7, and 8. The map includes 18 express conveyor tiles, 4 regular conveyor tiles, 2 gears, and the pictured walls. Only existing object types are included: lasers, energy stations, antenna, and reboot markers from the reference are omitted. No new object mechanics are introduced.

`MapLayoutService` loads the immutable resource catalog once on construction and validates every playable course. `MapLayoutValidator` can be reused by future game-session creation. It requires exactly one start board, at least one game board, no overlap, and one edge-connected map. Connections may share 1–10 tile edges. The start board may connect only through its exit: east at 0°, south at 90°, west at 180°, and north at 270°. Corner contact alone is not a connection. Template dimensions must match their kind. Resource coordinates must be JSON integers; no write endpoint is provided.

The default definition is now also used by training games. `POST /api/games` accepts optional `training: true`; new multiplayer rooms also use the selected catalog layout. Training rooms are solo-only. Their state includes an additive `layout` field alongside global robot coordinates and flattened tile data, so rendering and gameplay share one definition. The frontend displays that layout through `MapLayout` and places robots in global coordinates.

Training currently compiles only unrotated, nonnegative layouts that fill their rectangular bounds and contain a spawn. Unsupported definitions fail instead of silently creating playable floor outside the boards. The default is 13 × 10, spawning at zero-based `(1, 1)`, with checkpoint 1 at global `(10, 2)`.

Existing legacy room models without a map ID retain their 12 × 12 fallback. No existing endpoint is deprecated. Arbitrary rotated or offset layouts in live gameplay remain a later migration step.

Run backend tests from the repository root:

```sh
mvn -q -f backend/pom.xml test
```


## Lobby map and start selection

`GET /api/maps` returns the authenticated playable catalog. Register resource paths in `map-catalog.json`; its course list determines display order and `defaultMapId` selects the default. Catalog entries must have unique IDs and pass gameplay compilation, which currently supports unrotated, nonnegative, filled rectangular layouts.

Room responses include `mapId` and nullable `players[].startPosition` (zero-based global coordinates). The lobby fetches the catalog once and polls room state for reservations.

- `POST /api/games/{gameId}/map`, body `{"mapId":"extra-crispy"}`: host-only, waiting rooms only. A changed map clears all start reservations; reselecting the same map preserves them.
- `POST /api/games/{gameId}/start-tile`, body `{"mapId":"extra-crispy","position":{"x":1,"y":1}}`: reserve an available spawn. Use `"position":null` for automatic assignment. A stale map ID or occupied tile returns 409.
- All actions use the authenticated identity and require room membership. Reservations, joins and game start are synchronized. Rooms reject joins beyond the number of spawn tiles.
- At start, selected tiles are preserved, then remaining players receive free tiles in template order. Gameplay uses these positions and the selected layout. Setup is locked after start.

The frontend renders at most three memoized previews, with a shared selection for the room. Extra Crispy remains the default; Risky Crossing is also available in the catalog.


## Risky Crossing (5A)

`risky-crossing` uses the same start template and a game board at global `(3,0)`. In 1-based local coordinates, checkpoint 1 is at `(6,8)`, checkpoint 2 at `(9,1)`, and a clockwise gear at `(2,10)`. The supplied image defines a closed loop of 28 regular conveyor tiles and four corner paths totaling 16 express conveyor tiles. Game-board energy spaces are omitted because their mechanics are not implemented. There are no game-board pits or walls in this definition.

The host selects it through the existing map endpoint; the frontend catalog and carousel require no hardcoded map additions.


## Resource definitions

All paths below are relative to `src/main/resources`. Resources are read as classpath streams, including inside a packaged JAR.

- `map-catalog.json`: `defaultMapId`, ordered `startTemplates`, `boardTemplates`, and `courses` resource paths.
- `starttemplates/start-a.json`: reusable Start A terrain; tile array order determines automatic spawn assignment.
- `boardtemplates/4a.json` and `5a.json`: reusable terrain, without checkpoints.
- `racingcourses/*.json`: course ID/name, board placements, and checkpoint overlays.

A template has `id`, `name`, `kind`, `width`, `height`, and `tiles`. Tiles use the existing API fields; omitted boolean properties default to false. Coordinates must be present, unique and in bounds. Checkpoints belong exclusively to courses.

For example, add `racingcourses/new-race.json` to reuse 4A with a different checkpoint:

```json
{
  "id": "new-race",
  "name": "New Race",
  "boards": [
    { "id": "start", "templateId": "start-a", "x": 0, "y": 0, "rotation": 0 },
    { "id": "game", "templateId": "4a", "x": 3, "y": 0, "rotation": 0 }
  ],
  "checkpoints": [
    { "boardId": "game", "x": 7, "y": 2, "number": 1 }
  ]
}
```

Append its path to `courses` in `map-catalog.json`. To introduce terrain, create a new template and register its path in the appropriate template list. No Java or frontend change is needed. Restart the backend to load changes.

All resource coordinates are **zero-based**. Checkpoint coordinates and tile directions are local to the unrotated template; placement coordinates identify the rotated board's top-left corner. Checkpoint numbers must be unique and consecutive from 1, and cannot occupy pits. Overlays preserve the tile's other properties and never mutate shared templates.

`MapResourceLoader` handles reading/deserialization; `MapDefinitionValidator` checks definitions and references; `MapLayoutAssembler` adds course checkpoints; `MapLayoutValidator` checks geometry. Invalid definitions abort initialization with their resource path. The catalog additionally enforces the existing gameplay restriction to unrotated, nonnegative, filled rectangles. Rotation metadata remains local for the frontend renderer; this change does not add rotated gameplay.

Frontend renderer tests use small synthetic fixtures under `src/tests/fixtures`; they are not production course definitions. Production previews always use the backend catalog.

## Burnout (2B)

`burnout` reuses Start A and places template `2b` at global `(3,0)`, unrotated, in the supplied image's orientation. In **1-based game-board coordinates**, checkpoints 1–3 are at `(9,6)`, `(1,1)`, and `(10,10)`.

2B contains four pits, a clockwise gear, eight wall edges, four regular conveyors and sixteen express conveyors, including the twelve-tile clockwise central loop. Laser emitters/beams and energy spaces are omitted because their gameplay mechanics are not implemented. The reference image's different start strip is replaced by the shared Start A template.

## Standalone-board compatibility

Rooms created without `startBoardId` use the course catalog, including training. For compatibility with the standalone-board client, an explicit registered `startBoardId` (such as `classic_start`) creates a room using the legacy start board and `game1`–`game3`. Both modes share membership, capacity, reservation and start-lock checks. Room responses also include `startBoardConfig` with reservation owners.

Catalog start selection still requires `{ "mapId": "extra-crispy", "position": { "x": 1, "y": 1 } }`. The legacy `{ "x": 1, "y": 1 }` request is accepted only for standalone-board rooms, preventing old requests from bypassing map-change checks. Switching a standalone room to a catalog course clears its reservations and uses that course for gameplay.
