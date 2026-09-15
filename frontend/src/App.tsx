import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterForm } from './features/login-page/RegisterForm';
import { ForgotPasswordForm } from './features/login-page/ForgotPasswordForm';
import { ResetPasswordForm } from './features/login-page/ResetPasswordForm';
import { VerifyEmailForm } from './features/login-page/VerifyEmailForm';
import { MainMenuPage } from './features/menu/pages/MainMenuPage';
import { Map } from './features/game/components/map/Map';
import { ProgrammingPhase } from './features/game/components/programming/ProgrammingPhase';
import { useRobotMovement } from './features/game/hooks/useRobotMovement';
import { createRoom, type CreatedRoom, type JoinedRoom } from './features/game/api/gameApi';
import { HostBattlePage } from './features/game/pages/HostBattlePage';
import { JoinBattlePage } from './features/game/pages/JoinBattlePage';
import { MenuScreen } from './shared/components/menu-screen/MenuScreen';
import roboRallyImage from './assets/hero.png';
import { neon } from './lib/neon';

function GameScreen({ username }: { username: string; playerId: string }) {
  const navigate = useNavigate();
  const { robot, runProgram } = useRobotMovement();

  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-950 p-4">
      <div className="mb-4 flex w-full max-w-5xl justify-between text-slate-400">
        <button type="button" onClick={() => navigate('/menu')} className="underline hover:text-white">
          &larr; Back to Menu
        </button>
        <span className="font-bold text-robot-orange">Pilot: {username}</span>
      </div>

      <Board />
      <div className="mt-8 w-full max-w-5xl">
        <ProgrammingPhase roomId="123e4567-e89b-12d3-a456-426614174000" onLockIn={runProgram} />
      </div>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const { data: session, isPending } = neon.useSession();
  const user = session?.user;

  const [hostRoom, setHostRoom] = useState<CreatedRoom | null>(null);
  const [joinedRoom, setJoinedRoom] = useState<JoinedRoom | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomError, setRoomError] = useState('');
  const creatingRoom = useRef(false);

  if (isPending) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Loading...</div>;
  }

  const pilotName = user?.name || user?.email?.split('@')[0] || 'Unknown Pilot';

  const handleHostBattle = async () => {
    if (!user || creatingRoom.current) return;
    navigate('/host-battle');
    if (hostRoom) return;

    creatingRoom.current = true;
    setIsCreatingRoom(true);
    setRoomError('');

    try {
      setHostRoom(await createRoom(pilotName));
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
    navigate('/menu');
  };

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/menu" replace /> : <Navigate to="/login" replace />} />

      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/menu" replace />
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
          user ? (
            <Navigate to="/menu" replace />
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
          user ? (
            <Navigate to="/menu" replace />
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
          user ? (
            <Navigate to="/menu" replace />
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
          user ? (
            <Navigate to="/menu" replace />
          ) : (
            <MenuScreen img={roboRallyImage} subtitle="Account Security" title="Verify Email" panelClassName="max-w-md w-full">
              <VerifyEmailForm />
            </MenuScreen>
          )
        }
      />

      <Route
        path="/menu"
        element={
          user ? (
            <MainMenuPage
              username={pilotName}
              onStartGame={() => navigate('/game')}
              onHostBattle={handleHostBattle}
              onJoinBattle={() => navigate('/join-battle')}
              onLogout={async () => {
                await neon.signOut();
                navigate('/login');
              }}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* 4. Inject both the display name and the true ID into the game screen */}
      <Route
        path="/game"
        element={user ? <GameScreen username={pilotName} playerId={pilotId} /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/host-battle"
        element={
          user ? (
            <HostBattlePage
              username={pilotName}
              room={hostRoom}
              isCreating={isCreatingRoom}
              error={roomError}
              onRetry={handleHostBattle}
              onBack={handleRoomBack}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/join-battle"
        element={
          user ? (
            <JoinBattlePage username={pilotName} room={joinedRoom} onJoined={setJoinedRoom} onBack={handleRoomBack} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
