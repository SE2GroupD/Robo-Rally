import { useState } from 'react';
import { FrontPage } from './features/front-page/FrontPage';
import { LoginPage } from './features/login-page/LoginPage';
import type { LoginRequestDto } from './features/login-page/types';
import { MainMenuPage } from './features/main-menu/MainMenuPage';
import { ProgramRegisterSite } from './features/registerTest/testSite';

type AppView = 'front-page' | 'login';

function App() {
  const [view, setView] = useState<AppView>('front-page');
  // We'll store the logged-in player's info here. Null means they are at the login screen.
  const [playerInfo, setPlayerInfo] = useState<{ username: string; email?: string } | null>(null);

  // For now, we mock a successful login by setting the state directly
  const handleLogin = (dto: LoginRequestDto) => {
    setPlayerInfo({
      username: dto.email.split('@')[0], // Just grabbing the first part of the email as a mock username
      email: dto.email,
    });
  };

  const handleGuestLogin = () => {
    const randomGuestNumber = Math.floor(Math.random() * 9000) + 1000;
    setPlayerInfo({ username: `Guest_${randomGuestNumber}` });
  };

  if (window.location.pathname === '/test') {
    return <ProgramRegisterSite />;
  }

  if (!playerInfo) {
    if (view === 'front-page') {
      return <FrontPage onLoginClick={() => setView('login')} />;
    }

    return <LoginPage onBack={() => setView('front-page')} onLogin={handleLogin} onGuestLogin={handleGuestLogin} />;
  }

  return (
    <MainMenuPage
      onLogout={() => {
        setPlayerInfo(null);
        setView('front-page');
      }}
      username={playerInfo.username}
    />
  );
}

export default App;
