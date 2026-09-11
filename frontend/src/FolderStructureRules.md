# Frontend ownership policy

Classify code by responsibility and domain, never by component size. These rules apply to every new feature as well as existing code.

## Folder responsibilities

- `assets/`: Global images, icons, and global CSS reset files.
- `foundation/`: Primitive UI blocks used to build other components (Button, TextInput, Checkbox).
- `shared/`: Reusable composed UI shared across features (MenuScreen, Background).
- `features/`: Page-specific component groupings (e.g., `login-page/LoginPage`, `game-page/GamePage`).
- `hooks/`: Custom, reusable React logic (like the `useGameSocket` hook).
- `utils/`: Pure JavaScript/TypeScript helper functions.
