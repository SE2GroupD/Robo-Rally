import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAppNavigation } from './app/useAppNavigation';
import { LoginPage } from './features/auth/pages/LoginPage';
import { MainMenuPage } from './features/menu/pages/MainMenuPage';
import { GamePage } from './features/game/pages/GamePage';
import { HostBattlePage } from './features/game/pages/HostBattlePage';
import { JoinBattlePage } from './features/game/pages/JoinBattlePage';
import { StartPlatformPage } from './features/game/pages/StartPlatformPage';
import { MenuScreen } from './shared/components/menu-screen/MenuScreen';
import { VerifyEmailForm } from './features/auth/pages/VerifyEmailForm';
import { ResetPasswordForm } from './features/auth/pages/ResetPasswordForm';
import { ForgotPasswordForm } from './features/auth/pages/ForgotPasswordForm';
import { RegisterForm } from './features/auth/components/RegisterForm';
import roboRallyImage from './assets/hero.png';
import { neon } from './features/auth/lib/neon';
import { useRoomManager } from './features/game/hooks/useRoomManager';

function App() {
  const { navigate } = useAppNavigation();
  const location = useLocation();

  const { data: session, isPending } = neon.useSession();
  const user = session?.user;

  const playerInfo = user ? { username: user.name || user.email?.split('@')[0] || 'Unknown Pilot' } : null;

  const menuRedirect = <Navigate to="/main-menu" replace />;
  const loginRedirect = <Navigate to="/login" replace />;

  const roomManager = useRoomManager({ username: playerInfo?.username, pathname: location.pathname, navigate });

  if (isPending) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Loading...</div>;
  }

  const handleLogout = async () => {
    await roomManager.leaveActiveRoom();
    await neon.signOut();
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
              onStartGame={roomManager.startSoloGame}
              onStartPlatform={() => navigate('/start-platform')}
              onHostBattle={roomManager.hostBattle}
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
        path="/start-platform"
        element={
          playerInfo ? (
            <StartPlatformPage
              username={playerInfo.username}
              onBack={roomManager.returnToMenu}
              onJoined={roomManager.joinPublicRoom}
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
              room={roomManager.activeRoom}
              isStarting={roomManager.isStartingSolo}
              error={roomManager.soloError}
              onRetry={roomManager.startSoloGame}
              onBack={roomManager.returnToMenu}
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
              room={roomManager.hostRoom}
              isCreating={roomManager.isCreatingRoom}
              error={roomManager.roomError}
              onRetry={roomManager.hostBattle}
              onBack={roomManager.returnToMenu}
              onRoomChange={roomManager.setHostRoom}
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
            <JoinBattlePage
              username={playerInfo.username}
              room={roomManager.joinedRoom}
              onJoined={roomManager.setJoinedRoom}
              onBack={roomManager.returnToMenu}
              onRoomChange={roomManager.setJoinedRoom}
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
