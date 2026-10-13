# Backend map layout preview

`GET /api/maps/default` returns a static board layout compatible with the frontend's `MapLayoutData`. It requires the existing bearer-token authentication. It does not require a room, create a game session, or change any live game.

The response has one top-level field, `boards`. Each board has:

| Field | Meaning |
| --- | --- |
| `id` | Unique, nonempty board instance ID |
| `kind` | `start` (3 × 10 tiles) or `game` (10 × 10 tiles) |
| `x`, `y` | Integer top-left position of the rotated block in map tile coordinates; negative positions are supported |
| `rotation` | Clockwise degrees: `0`, `90`, `180`, or `270` |
| `tiles` | Special tiles, with coordinates and directions local to the unrotated board |

Tile fields reuse the existing `Tile` JSON contract. Unset optional properties are omitted; boolean flags are included. Missing tile positions inside a board represent ordinary floor. Spaces outside placed boards are not floor tiles.

The default preview matches `frontend/src/features/game/data/mapLayouts.ts`: an unrotated start board at `(0, 0)` containing the antenna at `(0, 0)` and a spawn at `(1, 4)`, and an unrotated game board at `(3, 0)` containing checkpoint 1 at local `(8, 4)`. The spawn marker is serialized as `isSpawnPoint`.

`MapLayoutService` stores an immutable definition and validates it on construction. `MapLayoutValidator` can be reused by future game-session creation. It requires exactly one start board, at least one game board, no overlap, and one edge-connected map. Connections may share 1–10 tile edges. The start board may connect only through its exit: east at 0°, south at 90°, west at 180°, and north at 270°. Corner contact alone is not a connection. Dimensions are determined by kind, not supplied in JSON. Java integer fields enforce integer positions in these code-defined layouts; no write endpoint is provided.

The default definition is now also used by training games. `POST /api/games` accepts optional `training: true`; omitted or false retains the classic multiplayer board. Training rooms are solo-only. Their state includes an additive `layout` field alongside global robot coordinates and flattened tile data, so rendering and gameplay share one definition. The frontend displays that layout through `MapLayout` and places robots in global coordinates.

Training currently compiles only unrotated, nonnegative layouts that fill their rectangular bounds and contain a spawn. Unsupported definitions fail instead of silently creating playable floor outside the boards. The default is 13 × 10, spawning at `(1, 4)`, with checkpoint 1 at global `(11, 4)`.

Multiplayer retains the 12 × 12 board and omits `layout` from its state response. No existing endpoint is deprecated. Arbitrary rotated or offset layouts in live gameplay remain a later migration step.

Run backend tests from the repository root:

```sh
mvn -q -f backend/pom.xml test
```
