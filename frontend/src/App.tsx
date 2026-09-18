import { Navigate, Route, Routes } from 'react-router-dom';
import { useAppNavigation } from './app/useAppNavigation';
import { FrontPage } from './features/menu/pages/FrontPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { MainMenuPage } from './features/menu/pages/MainMenuPage';
import { GamePage } from './features/game/pages/GamePage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { useRobotMovement } from './features/game/hooks/useRobotMovement';
import { useRef, useState } from 'react';
import { createRoom, type CreatedRoom, type JoinedRoom } from './features/game/api/gameApi';
import { HostBattlePage } from './features/game/pages/HostBattlePage';
import { JoinBattlePage } from './features/game/pages/JoinBattlePage';

function App() {
  const { navigate, playerInfo, handleLogin, handleGuestLogin, logout } = useAppNavigation();
  const { robot, runProgram } = useRobotMovement();
  const menuRedirect = <Navigate to="/main-menu" replace />;
  const loginRedirect = <Navigate to="/login" replace />;
  const [hostRoom, setHostRoom] = useState<CreatedRoom | null>(null);
  const [joinedRoom, setJoinedRoom] = useState<JoinedRoom | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomError, setRoomError] = useState('');
  const creatingRoom = useRef(false);
  const handleHostBattle = async () => {
    if (!playerInfo || creatingRoom.current) return;
    navigate('/host-battle');
    if (hostRoom) return;
    creatingRoom.current = true;
    setIsCreatingRoom(true);
    setRoomError('');

    try {
      setHostRoom(await createRoom(playerInfo.username));
    } catch {
      setRoomError('Could not create a room. Please try again.');
    } finally {
      creatingRoom.current = false;
      setIsCreatingRoom(false);
    }
  };

  const handleRoomBack = () => {
    setHostRoom(null);
    setJoinedRoom(null);
    setRoomError('');
    navigate('/main-menu');
  };
  const handleLogout = () => {
    setHostRoom(null);
    setJoinedRoom(null);
    setRoomError('');
    logout();
  };

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
            <MainMenuPage
              onStartGame={() => navigate('/game')}
              onHostBattle={handleHostBattle}
              onJoinBattle={() => navigate('/join-battle')}
              onLogout={handleLogout}
              username={playerInfo.username}
            />
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

      <Route
        path="/host-battle"
        element={
          playerInfo ? (
            <HostBattlePage
              username={playerInfo.username}
              room={hostRoom}
              isCreating={isCreatingRoom}
              error={roomError}
              onRetry={handleHostBattle}
              onBack={handleRoomBack}
            />
          ) : (
            loginRedirect
          )
        }
      />

      <Route
        path="/join-battle"
        element={
          playerInfo ? (
            <JoinBattlePage username={playerInfo.username} room={joinedRoom} onJoined={setJoinedRoom} onBack={handleRoomBack} />
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
