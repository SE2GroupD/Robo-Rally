import roboRallyImage from '../../../assets/hero.png';
import { Button } from '../../../foundation/components/button/Button';
import { MenuScreen } from '../../../shared/components/menu-screen/MenuScreen';
import { LoginForm } from '../components/LoginForm';
import type { LoginRequestDto } from '../types/auth';

interface LoginPageProps {
  onBack: () => void;
  onRegister: () => void;
  onGuestLogin: () => void;
  onLogin: (dto: LoginRequestDto) => void;
}

export function LoginPage({ onBack, onGuestLogin, onLogin, onRegister }: LoginPageProps) {
  return (
    <MenuScreen img={roboRallyImage} subtitle="Choose Your Pilot" title="Pilot Login">
      <LoginForm onLogin={onLogin} />

      <div className="text-center">
        <p className="m-0 text-sm text-text-muted">
          Don't have an account?{' '}
          <button
            className="cursor-pointer border-0 bg-transparent p-0 font-bold text-robot-orange underline"
            onClick={onRegister}
            type="button"
          >
            Register here
          </button>
        </p>
        <div className="my-5 flex items-center">
          <span className="h-px flex-1 bg-panel-border"></span>
          <span className="mx-4 text-sm font-bold text-text-muted">OR</span>
          <span className="h-px flex-1 bg-panel-border"></span>
        </div>

        <Button className="w-full" onClick={onGuestLogin} size="large" variant="secondary">
          Play as Guest
        </Button>
      </div>

      <Button className="w-full" onClick={onBack} size="small" variant="secondary">
        Back
      </Button>
    </MenuScreen>
  );
}
