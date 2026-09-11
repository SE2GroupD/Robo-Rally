import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { LoginPage } from './features/login-page/LoginPage';
import { RegisterForm } from './features/login-page/RegisterForm';
import { ForgotPasswordForm } from './features/login-page/ForgotPasswordForm';
import { ResetPasswordForm } from './features/login-page/ResetPasswordForm';
import { VerifyEmailForm } from './features/login-page/VerifyEmailForm';
import { MainMenuPage } from './features/main-menu/MainMenuPage';
<<<<<<< HEAD
import { Map } from './foundation/components/map/Map';
import { ProgrammingPhase } from './foundation/components/register-slot/ProgrammingPhase';
import { useRobotMovement } from './hooks/game/useRobotMovement';
import { MenuScreen } from './shared/components/menu-screen/MenuScreen';
import roboRallyImage from './assets/hero.png';
import { neon } from './lib/neon';

function GameScreen({ username }: { username: string }) {
  const navigate = useNavigate();
  const { robot, runProgram } = useRobotMovement();
=======
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
        <button onClick={() => setView('main-menu')} className="self-start mb-4 text-slate-400 hover:text-white underline">
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
>>>>>>> 3ae07d3 (Implement game programming phase with backend integration and CORS configuration)

  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-950 p-4">
      <div className="mb-4 flex w-full max-w-5xl justify-between text-slate-400">
        <button type="button" onClick={() => navigate('/menu')} className="underline hover:text-white">
          &larr; Back to Menu
        </button>
        <span className="font-bold text-robot-orange">Pilot: {username}</span>
      </div>

      <Map robot={robot} />

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

  if (isPending) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Loading...</div>;
  }

  const pilotName = user?.name || user?.email?.split('@')[0] || 'Unknown Pilot';

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

      <Route path="/game" element={user ? <GameScreen username={pilotName} /> : <Navigate to="/login" replace />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
