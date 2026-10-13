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

The default matches `frontend/src/features/game/data/mapLayouts.ts`: Extra Crispy, with an unrotated start board at `(0, 0)` and game board 4A at `(3, 0)`. The source is the user-supplied 4A image, oriented with its label upside down at the top-left. Coordinates below are 1-based and local to each board; code stores zero-based coordinates.

The permanent start template has spawn points at `(2,2)`, `(1,4)`, `(2,5)`, `(2,6)`, `(1,7)`, `(2,9)` in that order. Its walls are north at `(2,3)`, east at `(3,5)` and `(3,6)`, and south at `(2,8)`. No other start-board objects are included. Layout validation enforces this template before rotation.

Game-board checkpoints are 1 at `(8,3)`, 2 at `(3,8)`, 3 at `(8,8)`, and 4 at `(3,3)`. Pits occupy columns 4 and 7 in rows 3, 4, 7, and 8. The map includes 18 express conveyor tiles, 4 regular conveyor tiles, 2 gears, and the pictured walls. Only existing object types are included: lasers, energy stations, antenna, and reboot markers from the reference are omitted. No new object mechanics are introduced.

`MapLayoutService` stores an immutable definition and validates it on construction. `MapLayoutValidator` can be reused by future game-session creation. It requires exactly one start board, at least one game board, no overlap, and one edge-connected map. Connections may share 1–10 tile edges. The start board may connect only through its exit: east at 0°, south at 90°, west at 180°, and north at 270°. Corner contact alone is not a connection. Dimensions are determined by kind, not supplied in JSON. Java integer fields enforce integer positions in these code-defined layouts; no write endpoint is provided.

The default definition is now also used by training games. `POST /api/games` accepts optional `training: true`; new multiplayer rooms also use the selected catalog layout. Training rooms are solo-only. Their state includes an additive `layout` field alongside global robot coordinates and flattened tile data, so rendering and gameplay share one definition. The frontend displays that layout through `MapLayout` and places robots in global coordinates.

Training currently compiles only unrotated, nonnegative layouts that fill their rectangular bounds and contain a spawn. Unsupported definitions fail instead of silently creating playable floor outside the boards. The default is 13 × 10, spawning at zero-based `(1, 1)`, with checkpoint 1 at global `(10, 2)`.

Existing legacy room models without a map ID retain their 12 × 12 fallback. No existing endpoint is deprecated. Arbitrary rotated or offset layouts in live gameplay remain a later migration step.

Run backend tests from the repository root:

```sh
mvn -q -f backend/pom.xml test
```


## Lobby map and start selection

`GET /api/maps` returns the authenticated playable catalog. Add definitions to the immutable list in `MapLayoutService`; the first is the default. Catalog entries must have unique IDs and pass gameplay compilation, which currently supports unrotated, nonnegative, filled rectangular layouts.

Room responses include `mapId` and nullable `players[].startPosition` (zero-based global coordinates). The lobby fetches the catalog once and polls room state for reservations.

- `POST /api/games/{gameId}/map`, body `{"mapId":"extra-crispy"}`: host-only, waiting rooms only. A changed map clears all start reservations; reselecting the same map preserves them.
- `POST /api/games/{gameId}/start-tile`, body `{"mapId":"extra-crispy","position":{"x":1,"y":1}}`: reserve an available spawn. Use `"position":null` for automatic assignment. A stale map ID or occupied tile returns 409.
- All actions use the authenticated identity and require room membership. Reservations, joins and game start are synchronized. Rooms reject joins beyond the number of spawn tiles.
- At start, selected tiles are preserved, then remaining players receive free tiles in template order. Gameplay uses these positions and the selected layout. Setup is locked after start.

The frontend renders at most three memoized previews, with a shared selection for the room. Extra Crispy is the only production entry; multiple-map navigation is covered with test fixtures.
