import { useAppNavigation } from './app/useAppNavigation';
import { FrontPage } from './features/menu/pages/FrontPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { MainMenuPage } from './features/menu/pages/MainMenuPage';
import { GamePage } from './features/game/pages/GamePage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { useRobotMovement } from './features/game/hooks/useRobotMovement';

function App() {
  const { view, setView, playerInfo, handleLogin, handleGuestLogin, logout } = useAppNavigation();
  const { robot, runProgram } = useRobotMovement();

  if (!playerInfo) {
    if (view === 'front-page') {
      return <FrontPage onLoginClick={() => setView('login')} />;
    }

    if (view === 'register') {
      return <RegisterPage onBack={() => setView('login')} onGuestLogin={handleGuestLogin} />;
    }

    return (
      <LoginPage
        onRegister={() => setView('register')}
        onBack={() => setView('front-page')}
        onLogin={handleLogin}
        onGuestLogin={handleGuestLogin}
      />
    );
  }

  if (view === 'game') {
    return <GamePage onBack={() => setView('main-menu')} playerId={playerInfo.username} robot={robot} runProgram={runProgram} />;
  }

  return <MainMenuPage onStartGame={() => setView('game')} onLogout={logout} username={playerInfo.username} />;
}

export default App;
