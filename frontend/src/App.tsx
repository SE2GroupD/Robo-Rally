import { Navigate, Route, Routes } from 'react-router-dom';
import { useAppNavigation } from './app/useAppNavigation';
import { LoginPage } from './features/auth/pages/LoginPage';
import { MainMenuPage } from './features/menu/pages/MainMenuPage';
import { GamePage } from './features/game/pages/GamePage';
import { useRobotMovement } from './features/game/hooks/useRobotMovement';
import { useRef, useState } from 'react';
import { createRoom, type CreatedRoom, type JoinedRoom } from './features/game/api/gameApi';
import { HostBattlePage } from './features/game/pages/HostBattlePage';
import { JoinBattlePage } from './features/game/pages/JoinBattlePage';
import { MenuScreen } from './shared/components/menu-screen/MenuScreen';
import { VerifyEmailForm } from './features/auth/pages/VerifyEmailForm';
import { ResetPasswordForm } from './features/auth/pages/ResetPasswordForm';
import { ForgotPasswordForm } from './features/auth/pages/ForgotPasswordForm';
import { RegisterForm } from './features/auth/components/RegisterForm';
import roboRallyImage from './assets/hero.png';
import { neon } from './features/auth/lib/neon';

function App() {
  const { navigate } = useAppNavigation();
  const { robot, runProgram } = useRobotMovement();

  // 1. Use Neon as the source of truth for Auth
  const { data: session, isPending } = neon.useSession();
  const user = session?.user;

  // Create playerInfo dynamically from the Neon user session
  const playerInfo = user ? { username: user.name || user.email?.split('@')[0] || 'Unknown Pilot' } : null;

  const menuRedirect = <Navigate to="/main-menu" replace />;
  const loginRedirect = <Navigate to="/login" replace />;

  const [hostRoom, setHostRoom] = useState<CreatedRoom | null>(null);
  const [joinedRoom, setJoinedRoom] = useState<JoinedRoom | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomError, setRoomError] = useState('');
  const creatingRoom = useRef(false);

  // 2. CRITICAL: Wait for Neon to initialize before rendering protected routes.
  // This prevents the router from instantly kicking you back to login after you authenticate.
  if (isPending) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Loading...</div>;
  }

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

  const handleLogout = async () => {
    setHostRoom(null);
    setJoinedRoom(null);
    setRoomError('');
    await neon.signOut(); // 3. Ensure Neon clears the session
    navigate('/login');
  };

  return (
    <Routes>
      <Route path="/" element={playerInfo ? menuRedirect : <Navigate to="/login" replace />} />

      <Route
        path="/login"
        element={
          playerInfo ? (
            menuRedirect
          ) : (
            <MenuScreen img={roboRallyImage} subtitle="Authenticate" title="Pilot Login" panelClassName="max-w-md w-full">
              <LoginPage />
            </MenuScreen>
          )
        }
      />

      <Route
        path="/register"
        element={
          playerInfo ? (
            menuRedirect
          ) : (
            <MenuScreen img={roboRallyImage} subtitle="Enlist as a Pilot" title="Pilot Login" panelClassName="max-w-md w-full">
              <RegisterForm />
            </MenuScreen>
          )
        }
      />

      <Route
        path="/forgot-password"
        element={
          playerInfo ? (
            menuRedirect
          ) : (
            <MenuScreen img={roboRallyImage} subtitle="Recover Access" title="Pilot Login" panelClassName="max-w-md w-full">
              <ForgotPasswordForm />
            </MenuScreen>
          )
        }
      />

      <Route
        path="/reset-password"
        element={
          playerInfo ? (
            menuRedirect
          ) : (
            <MenuScreen img={roboRallyImage} subtitle="Verify Reset Code" title="Pilot Login" panelClassName="max-w-md w-full">
              <ResetPasswordForm />
            </MenuScreen>
          )
        }
      />

      <Route
        path="/verify-email"
        element={
          playerInfo ? (
            menuRedirect
          ) : (
            <MenuScreen img={roboRallyImage} subtitle="Account Security" title="Verify Email" panelClassName="max-w-md w-full">
              <VerifyEmailForm />
            </MenuScreen>
          )
        }
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
