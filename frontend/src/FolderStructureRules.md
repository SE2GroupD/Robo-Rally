# Frontend ownership policy

Classify code by responsibility and domain, never by component size. These rules apply to every new feature as well as existing code.

## Folder responsibilities

| Location                         | Responsibility                                                         | Examples                             |
| -------------------------------- | ---------------------------------------------------------------------- | ------------------------------------ |
| `app/`, `App.tsx`, `main.ts`     | Application composition, navigation, and coordination between features | `useAppNavigation`                   |
| `features/<feature>/pages/`      | Complete screens that connect state and actions to components          | `GamePage`, `LoginPage`              |
| `features/<feature>/components/` | UI owned by a feature, used once or repeatedly within it               | `Map`, `Tile`, `LoginForm`           |
| `features/<feature>/hooks/`      | Feature state and behavior                                             | `useRobotMovement`, `useProgramming` |
| `features/<feature>/api/`        | Feature network calls                                                  | `gameApi`                            |
| `features/<feature>/types/`      | Domain types and API DTOs shared within a feature                      | `TileData`, `RobotState`, `CardType` |
| `features/<feature>/data/`       | Feature data and layouts                                               | `static feature data`                |
| `foundation/components/`         | Generic UI primitives with no Robo Rally concepts                      | `Button`, `TextInput`                |
| `shared/components/`             | Composed, feature-independent UI used by at least two features         | `MenuScreen`, `Background`           |
| `utils/`                         | Generic, domain-independent functions                                  | `cn`                                 |
| `assets/`                        | Existing static image and other asset files                            | Hero image, card images              |
| `tests/`                         | Central test files and test setup                                      | Component and navigation tests       |

Use lowercase folder names (hyphens for multiple words) and PascalCase component filenames. Create folders only when they contain code; a feature does not need an empty `components/` folder. Component-local props stay with the component. Domain types used by hooks or data belong in the feature's `types/` folder.

## Allowed imports

All layers may import installed external packages. Local imports follow this table:

| Source                          | Allowed local targets                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| Application orchestration       | Features, shared, foundation, generic utilities/assets, application code               |
| Feature pages                   | Same feature, shared, foundation, generic utilities/assets                             |
| Feature components              | Same feature except pages, shared, foundation, generic utilities/assets                |
| Feature hooks, API, data, types | Same feature except pages and components, shared, foundation, generic utilities/assets |
| Foundation                      | Foundation, generic utilities/assets                                                   |
| Shared                          | Shared, foundation, generic utilities/assets                                           |
| Generic utilities/assets        | Generic utilities/assets                                                               |
| Central tests                   | Any layer                                                                              |

Production code must never import tests. Features must never import another feature or application orchestration. Components and supporting logic must never import pages, including through re-exports. Shared and foundation must never import features. Unclassified source locations are rejected; application coordination belongs in `app/`, not a new top-level catch-all folder.

## Placement decisions

1. Does this code know about game boards, robots, cards, or programming registers? Put it in `features/game`, even if it is tiny or appears on several screens.
2. Does it belong to authentication or menu navigation UI? Put it in `features/auth` or `features/menu` respectively.
3. Is it a generic UI primitive, usable without knowledge of Robo Rally? Put it in foundation.
4. Is it composed UI already used by at least two features, with no feature-specific behavior or types? Put it in shared.
5. Otherwise, keep it with its owning feature. Reuse within a feature does not qualify it for shared.

`Map.tsx` stays at the top of `features/game/components/map/` and connects viewport behavior to live backend grid rendering. `MapLayout.tsx` separately composes and validates placed board blocks from layout data. `MapZoomControls.tsx` renders the zoom buttons, while `game/hooks/useMapViewport.ts` owns scale, scroll positioning, pointer capture, and drag handlers. The `boards/` subfolder contains the fixed-size `GameBoard` (10 × 10) and `StartBoard` (3 × 10), plus the shared `TileGrid` and `Tile` renderers. The live map uses `TileGrid` directly to preserve backend dimensions. The `objects/` subfolder contains `Robot` and `Checkpoint`, which render objects placed on tiles. Board layouts remain in `game/data/` and domain types in `game/types/`. None of these game components belongs in foundation. All programming UI, including `RegisterSlot` and `ProgramRegisters`, belongs in `features/game/components/programming/`.

Only application orchestration coordinates features, using props and callbacks. `App.tsx` renders page components. It keeps the robot movement hook mounted while switching pages, preserving the current training position. Game layout belongs in `GamePage`; authentication forms belong in the auth feature.

## Enforcement

`npm run lint:boundaries` uses TypeScript module resolution to check imports, type imports, re-exports, and literal dynamic imports. Relative path spelling and configured aliases do not bypass ownership checks. Nonliteral module paths are rejected because their ownership cannot be checked statically. New feature names are checked automatically.

`npm run lint` includes boundary checks, and CI runs them through `npm run check`. `npm run test:boundaries` verifies the checker. Central test files are exempt as import sources; production imports remain checked.

The checker enforces dependency direction. Reviewers must also enforce semantic placement: a self-contained game component in foundation can have valid imports and still violate this policy. Do not weaken the checker to accommodate misplaced code; move it to its owner.

## Programming layouts

`components/programming/ProgrammingPhase.tsx` connects state and controls. `ProgrammingCard.tsx` renders a card. The `register/` subfolder groups `RegisterSlot.tsx`, `ProgramRegisters.tsx` (five slots), and `ProgrammingHand.tsx` (nine slots). Both layouts use the same slot and card components.

The hand keeps nine positions before and after fetching. Selected cards leave empty hand slots; removing or clearing returns each card to its original position. `useProgramming` owns selection and submission; layout components receive card values and index callbacks. Backend submission contains only the five ordered card types.

The game page owns the desktop/tablet top bar, vertical player sidebar, and main game region. `ProgrammingPhase` keeps one `useProgramming` instance and accepts a `board` content slot. The board occupies the area above a 240px bottom panel. That panel separates program registers/actions on the left from the scrolling hand and card piles on the right, using gold and cyan accents. All five registers remain visible; hand positions stay fixed when selected. `CardPiles` displays the draw/discard counts returned by `useProgramming`, without estimating them from local selection. Existing steel-slot and card artwork is shared. Map fitting responds to the actual board container until manual pan/zoom; it never overlaps programming controls.

## Lobby and active game ownership

`components/room/RoomSession.tsx` composes the waiting lobby only. Its widgets are grouped in sibling folders under `room/`: `room-code/`,
`player-section/`, `robot-section/`, `room-visability/`, and `map-selection/`.
Each folder contains its section component and any supporting components.
`pages/GamePage.tsx` composes the active map, programming interface, and
`components/gameplay/` components (race progress, round status,
and match winner). Display-only formatting helpers stay with their owning overlay.

`hooks/useRoomSession.ts` owns room polling, membership/closure, leave actions,
and the shared mutation lock and revision guard. `hooks/useRoomSetup.ts` owns
lobby setup mutations through that guard. `data/roomReadiness.ts` computes the multiplayer start-block reason (at least two players, each with a robot and start tile); `PlayerSection` renders selection/readiness badges. Training startup remains owned by the solo flow and backend defaults. Shared robot artwork belongs in
`data/avatars.ts`. Room lifecycle feedback can be reused by the lobby and game
without putting gameplay back into RoomSession.

Final race results live in `components/gameplay/match-results/`: the accessible
dialog composes the podium, standings, and robot artwork. `data/matchResults.ts`
uses `data/raceStandings.ts` to rank checkpoint progress with shared competition places; `hooks/useMatchResults.ts`
freezes the final snapshot and owns reveal/dismiss/reopen state. Results appear
after replay, while the board and disabled final program remain mounted.

Live race widgets live in `components/gameplay/race-progress/`. They share ranking and robot artwork with final results. `useGameReplay` holds displayed progress until replay finishes; readiness remains live. GamePage places the leaderboard in the left sidebar.
