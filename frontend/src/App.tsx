import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAppNavigation } from './app/useAppNavigation';
import { LoginPage } from './features/auth/pages/LoginPage';
import { MainMenuPage } from './features/menu/pages/MainMenuPage';
import { GamePage } from './features/game/pages/GamePage';
import { useEffect, useRef, useState } from 'react';
import { createRoom, startRoom, leaveRoom, type CreatedRoom, type JoinedRoom } from './features/game/api/gameApi';
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

function App() {
  const { navigate } = useAppNavigation();
  const location = useLocation();

  const { data: session, isPending } = neon.useSession();
  const user = session?.user;

  const playerInfo = user ? { username: user.name || user.email?.split('@')[0] || 'Unknown Pilot' } : null;

  const menuRedirect = <Navigate to="/main-menu" replace />;
  const loginRedirect = <Navigate to="/login" replace />;

  const [hostRoom, setHostRoom] = useState<CreatedRoom | null>(null);
  const [joinedRoom, setJoinedRoom] = useState<JoinedRoom | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomError, setRoomError] = useState('');
  const creatingRoom = useRef(false);
  const [soloRoom, setSoloRoom] = useState<JoinedRoom | null>(null);
  const [isStartingSolo, setIsStartingSolo] = useState(false);
  const [soloError, setSoloError] = useState('');
  const startingSolo = useRef(false);
  const leavingRoom = useRef(false);
  const previousPathname = useRef(location.pathname);

  const activeRoom = soloRoom || hostRoom || joinedRoom;

  useEffect(() => {
    const isRoomRoute = ['/game', '/host-battle', '/join-battle'].includes(location.pathname);
    const wasOnRoomRoute = ['/game', '/host-battle', '/join-battle'].includes(previousPathname.current);
    previousPathname.current = location.pathname;

    if (!activeRoom || isRoomRoute || !wasOnRoomRoute || leavingRoom.current) return;

    leavingRoom.current = true;
    void leaveRoom(activeRoom)
      .catch(() => {
        // Navigating away should not trap a player on the old route if cleanup fails.
      })
      .finally(() => {
        setHostRoom(null);
        setJoinedRoom(null);
        setSoloRoom(null);
        setRoomError('');
        setSoloError('');
        leavingRoom.current = false;
      });
  }, [activeRoom, location.pathname]);

  if (isPending) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Loading...</div>;
  }

  const handleStartGame = async () => {
    if (!playerInfo || startingSolo.current) return;
    navigate('/game');
    if (soloRoom) return;
    startingSolo.current = true;
    setIsStartingSolo(true);
    setSoloError('');

    let created: CreatedRoom | null = null;
    try {
      created = await createRoom(playerInfo.username);
      setSoloRoom(await startRoom(created));
    } catch {
      if (created) void leaveRoom(created).catch(() => {});
      setSoloError('Could not start the game. Please try again.');
    } finally {
      startingSolo.current = false;
      setIsStartingSolo(false);
    }
  };

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
    setSoloRoom(null);
    setSoloError('');
    navigate('/main-menu');
  };

  const handleLogout = async () => {
    if (activeRoom) await leaveRoom(activeRoom).catch(() => {});
    setHostRoom(null);
    setJoinedRoom(null);
    setRoomError('');
    setSoloRoom(null);
    setSoloError('');
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
              onStartGame={handleStartGame}
              onStartPlatform={() => navigate('/start-platform')}
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
        path="/start-platform"
        element={
          playerInfo ? (
            <StartPlatformPage
              username={playerInfo.username}
              onBack={handleRoomBack}
              onCreated={(room) => {
                setHostRoom(room);
                navigate('/host-battle');
              }}
              onJoined={(room) => {
                setJoinedRoom(room);
                navigate('/join-battle');
              }}
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
              room={activeRoom}
              isStarting={isStartingSolo}
              error={soloError}
              onRetry={handleStartGame}
              onBack={handleRoomBack}
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
              onRoomChange={setHostRoom}
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
              room={joinedRoom}
              onJoined={setJoinedRoom}
              onBack={handleRoomBack}
              onRoomChange={setJoinedRoom}
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
