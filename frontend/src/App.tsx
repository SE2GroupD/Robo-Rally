import { Navigate, Route, Routes } from 'react-router-dom';
import { useAppNavigation } from './app/useAppNavigation';
import { FrontPage } from './features/menu/pages/FrontPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { MainMenuPage } from './features/menu/pages/MainMenuPage';
import { GamePage } from './features/game/pages/GamePage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { useRobotMovement } from './features/game/hooks/useRobotMovement';

function App() {
  const { navigate, playerInfo, handleLogin, handleGuestLogin, logout } = useAppNavigation();
  const { robot, runProgram } = useRobotMovement();
  const menuRedirect = <Navigate to="/main-menu" replace />;
  const loginRedirect = <Navigate to="/login" replace />;

  return (
    <Routes>
      <Route path="/" element={playerInfo ? menuRedirect : <FrontPage onLoginClick={() => navigate('/login')} />} />
      <Route
        path="/login"
        element={
          playerInfo ? (
            menuRedirect
          ) : (
            <LoginPage
              onRegister={() => navigate('/register')}
              onBack={() => navigate('/')}
              onLogin={handleLogin}
              onGuestLogin={handleGuestLogin}
            />
          )
        }
      />
      <Route
        path="/register"
        element={playerInfo ? menuRedirect : <RegisterPage onBack={() => navigate('/login')} onGuestLogin={handleGuestLogin} />}
      />
      <Route
        path="/main-menu"
        element={
          playerInfo ? (
            <MainMenuPage onStartGame={() => navigate('/game')} onLogout={logout} username={playerInfo.username} />
          ) : (
            loginRedirect
          )
        }
      />
      <Route
        path="/game"
        element={
          playerInfo ? (
            <GamePage
              onBack={() => navigate('/main-menu')}
              playerId={playerInfo.username}
              robot={robot}
              runProgram={runProgram}
            />
          ) : (
            loginRedirect
          )
        }
      />
      <Route path="*" element={<Navigate to={playerInfo ? '/main-menu' : '/'} replace />} />
    </Routes>
  );
}

export default App;
