import roboRallyImage from '../../../assets/hero.png';
import { Button } from '../../../foundation/components/button/Button';
import { MenuScreen } from '../../../shared/components/menu-screen/MenuScreen';

interface RegisterPageProps {
  onBack: () => void;
  onGuestLogin: () => void;
}

export function RegisterPage({ onBack, onGuestLogin }: RegisterPageProps) {
  return (
    <MenuScreen img={roboRallyImage} subtitle="Create Your Pilot" title="Pilot Registration">
      <p className="m-0 text-center text-sm text-text-muted">
        Pilot registration is not connected yet. Use guest mode for this build.
      </p>
      <Button className="w-full" onClick={onGuestLogin} size="large" variant="secondary">
        Play as Guest
      </Button>
      <Button className="w-full" onClick={onBack} size="small" variant="secondary">
        Back to Login
      </Button>
    </MenuScreen>
  );
}
