import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { LoginPage } from './features/login-page/LoginPage';
import { RegisterForm } from './features/login-page/RegisterForm';
import { ForgotPasswordForm } from './features/login-page/ForgotPasswordForm';
import { ResetPasswordForm } from './features/login-page/ResetPasswordForm';
import { MainMenuPage } from './features/main-menu/MainMenuPage';
import { Board } from './foundation/components/map/Board';
import { ProgrammingPhase } from './foundation/components/register-slot/ProgrammingPhase';
import { MenuScreen } from './shared/components/menu-screen/MenuScreen';
import roboRallyImage from './assets/hero.png';
import { neon } from './lib/neon';

function GameScreen({ username, playerId }: { username: string; playerId: string }) {
  const navigate = useNavigate();
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
        <ProgrammingPhase roomId="123e4567-e89b-12d3-a456-426614174000" playerId={playerId} />
      </div>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const { data: session, isPending } = neon.useSession();
  const user = session?.user;

  if (isPending) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Loading...</div>;
  }

  const pilotName = user?.name || user?.email?.split('@')[0] || 'Unknown Pilot';

  // 3. Extract the true cryptographic user ID from Neon (fallback to empty string if undefined)
  const pilotId = user?.id || '';

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
        path="/menu"
        element={
          user ? (
            <MainMenuPage
              username={pilotName}
              onStartGame={() => navigate('/game')}
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

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
