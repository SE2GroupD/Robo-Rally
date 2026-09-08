### The Standard React Project Structure

Instead of grouping by file type, standard React applications group by feature or route. This is called **co-location**. If a component needs a specific CSS file, a TypeScript interface, and a test file, they all live together in the same folder.


A typical modern React `src` directory looks like this:

- `assets/`: Global images, icons, and global CSS reset files.
- `foundation/`: Primitive UI blocks used to build other components (Button, TextInput, Checkbox).
- `shared/`: Reusable composed UI shared across features (MenuScreen, Background).
- `features/`: Page-specific component groupings (e.g., `login-page/LoginPage`, `game-page/GamePage`).
- `hooks/`: Custom, reusable React logic (like the `useGameSocket` hook).
- `utils/`: Pure JavaScript/TypeScript helper functions.
