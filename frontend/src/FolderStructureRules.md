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
| `features/<feature>/data/`       | Feature data and layouts                                               | `mapLayouts`                         |
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

`Map` composes `StartBoard` and `GameBoard`, which render `Tile`. All belong in `features/game/components/map/`, alongside `Robot` and `Checkpoint`. None belongs in foundation. All programming UI, including `RegisterSlot` and `ProgramRegisters`, belongs in `features/game/components/programming/`.

Only application orchestration coordinates features, using props and callbacks. `App.tsx` renders page components. It keeps the robot movement hook mounted while switching pages, preserving the current training position. Game layout belongs in `GamePage`; authentication forms belong in the auth feature.

## Enforcement

`npm run lint:boundaries` uses TypeScript module resolution to check imports, type imports, re-exports, and literal dynamic imports. Relative path spelling and configured aliases do not bypass ownership checks. Nonliteral module paths are rejected because their ownership cannot be checked statically. New feature names are checked automatically.

`npm run lint` includes boundary checks, and CI runs them through `npm run check`. `npm run test:boundaries` verifies the checker. Central test files are exempt as import sources; production imports remain checked.

The checker enforces dependency direction. Reviewers must also enforce semantic placement: a self-contained game component in foundation can have valid imports and still violate this policy. Do not weaken the checker to accommodate misplaced code; move it to its owner.

## Programming layouts

`components/programming/ProgrammingPhase.tsx` connects state and controls. `ProgrammingCard.tsx` renders a card. The `register/` subfolder groups `RegisterSlot.tsx`, `ProgramRegisters.tsx` (five slots), and `ProgrammingHand.tsx` (nine slots). Both layouts use the same slot and card components.

The hand keeps nine positions before and after fetching. Selected cards leave empty hand slots; removing or clearing returns each card to its original position. `useProgramming` owns selection and submission; layout components receive card values and index callbacks. Backend submission contains only the five ordered card types.
