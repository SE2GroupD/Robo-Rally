import { useState } from 'react';
import { FrontPage } from './features/front-page/FrontPage';
import { LoginPage } from './features/login-page/LoginPage';
import type { LoginRequestDto } from './features/login-page/types';
import { MainMenuPage } from './features/main-menu/MainMenuPage';
import { Board } from './foundation/components/map/Board';
import { ProgrammingPhase } from './foundation/components/register-slot/ProgrammingPhase';

type AppView = 'front-page' | 'login' | 'main-menu' | 'game';

function App() {
  const [view, setView] = useState<AppView>('front-page');
  const [playerInfo, setPlayerInfo] = useState<{ username: string; email?: string } | null>(null);

  const handleLogin = (dto: LoginRequestDto) => {
    setPlayerInfo({
      username: dto.email.split('@')[0],
      email: dto.email,
    });
  };

  const handleGuestLogin = () => {
    const randomGuestNumber = Math.floor(Math.random() * 9000) + 1000;
    setPlayerInfo({ username: `Guest_${randomGuestNumber}` });
  };

  if (!playerInfo) {
    if (view === 'front-page') {
      return <FrontPage onLoginClick={() => setView('login')} />;
    }

    return <LoginPage onBack={() => setView('front-page')} onLogin={handleLogin} onGuestLogin={handleGuestLogin} />;
  }

  if (view === 'game') {
    // 2. Render both the Board and the Programming Phase in the game view!
    // We'll pass a mock roomId for now since room creation isn't built yet.
    return (
      <div className="flex min-h-screen flex-col items-center bg-slate-950 p-4">
        <button
          type="button"
          onClick={() => setView('main-menu')}
          className="self-start mb-4 text-slate-400 hover:text-white underline"
        >
          &larr; Back to Menu
        </button>

        {/* Your 2D grid/map */}
        <Board />

        {/* The new card interface */}
        <div className="mt-8 w-full max-w-5xl">
          <ProgrammingPhase roomId="123e4567-e89b-12d3-a456-426614174000" playerId={playerInfo.username} />
        </div>
      </div>
    );
  }

  return (
    <MainMenuPage
      onStartGame={() => setView('game')}
      onLogout={() => {
        setPlayerInfo(null);
        setView('front-page');
      }}
      username={playerInfo.username}
    />
  );
}

export default App;
