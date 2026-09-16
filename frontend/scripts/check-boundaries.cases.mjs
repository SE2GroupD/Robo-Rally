import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { boundaryError, checkProject } from './check-boundaries.mjs';

const allowed = [
  ['App.tsx', 'features/game/pages/GamePage.tsx'],
  ['app/navigation.ts', 'features/auth/types/auth.ts'],
  ['foundation/components/Button.tsx', 'utils/cn.ts'],
  ['foundation/components/Button.tsx', 'foundation/components/Icon.tsx'],
  ['shared/components/Menu.tsx', 'foundation/components/Button.tsx'],
  ['shared/components/Menu.tsx', 'shared/components/Background.tsx'],
  ['features/game/pages/GamePage.tsx', 'features/game/components/map/Map.tsx'],
  ['features/game/components/map/Map.tsx', 'features/game/types/board.ts'],
  ['features/game/hooks/useGame.ts', 'features/game/api/gameApi.ts'],
  ['features/game/components/map/Map.tsx', 'shared/components/Background.tsx'],
  ['features/auth/components/Form.tsx', 'foundation/components/Button.tsx'],
  ['features/auth/components/Form.tsx', 'assets/hero.png'],
  ['tests/unit/App.test.tsx', 'features/game/pages/GamePage.tsx'],
];
for (const [source, target] of allowed) {
  test(`allows ${source} -> ${target}`, () => assert.equal(boundaryError(source, target), null));
}
const forbidden = [
  ['foundation/components/Button.tsx', 'shared/components/Menu.tsx'],
  ['foundation/components/Button.tsx', 'features/game/types/board.ts'],
  ['shared/components/Menu.tsx', 'features/game/components/map/Map.tsx'],
  ['shared/components/Menu.tsx', 'App.tsx'],
  ['features/auth/pages/LoginPage.tsx', 'features/game/types/board.ts'],
  ['features/new-feature/pages/Page.tsx', 'features/auth/types/auth.ts'],
  ['features/game/components/map/Map.tsx', 'features/game/pages/GamePage.tsx'],
  ['features/game/hooks/useGame.ts', 'features/game/pages/GamePage.tsx'],
  ['features/game/hooks/useGame.ts', 'features/game/components/map/Map.tsx'],
  ['features/game/types/board.ts', 'features/game/components/map/Tile.tsx'],
  ['features/game/pages/GamePage.tsx', 'app/navigation.ts'],
  ['utils/cn.ts', 'features/game/types/board.ts'],
  ['utils/cn.ts', 'foundation/components/Button.tsx'],
  ['features/game/pages/GamePage.tsx', 'tests/unit/App.test.tsx'],
  ['hooks/useGame.ts', 'features/game/types/board.ts'],
];
for (const [source, target] of forbidden) {
  test(`rejects ${source} -> ${target}`, () => assert.ok(boundaryError(source, target)));
}

test('resolves normalized paths, aliases, type imports, re-exports and dynamic imports', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'robo-boundaries-'));
  const write = (file, text) => {
    const target = path.join(dir, file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, text);
  };
  try {
    write('tsconfig.app.json', JSON.stringify({ compilerOptions: { paths: { '@/*': ['./src/*'] } }, include: ['src'] }));
    write('src/features/other/types/value.ts', 'export type Value = string;');
    write('src/features/game/types/local.ts', 'export type Local = number;');
    write(
      'src/features/game/components/Example.ts',
      `
      import type { Value } from '../../other/types/../types/value';
      export { Value } from '@/features/other/types/value';
      export * from '../../other/types/value';
      const lazy = import('../../other/types/value');
      type V = import('../../other/types/value').Value;
      import type { Local } from '../types/local';
    `,
    );
    write('src/tests/example.ts', "import '../../unresolved-test-helper';");
    const errors = checkProject(dir);
    assert.equal(errors.length, 5, errors.join('\n'));
    for (const error of errors) {
      assert.match(error, /features\/game\/components\/Example.ts:\d+ -> features\/other\/types\/value.ts/);
    }
    write('src/features/game/components/Example.ts', "import './missing'; const lazy = import(variable);");
    const invalid = checkProject(dir);
    assert.equal(invalid.length, 2);
    assert.match(invalid[0], /Cannot resolve local module/);
    assert.match(invalid[1], /Module paths must be literals/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
