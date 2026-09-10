import roboRallyImage from '../../assets/hero.png';
import { Button } from '../../foundation/components/button/Button';
import { MenuScreen } from '../../shared/components/menu-screen/MenuScreen';

interface MainMenuPageProps {
  username: string;
  onLogout: () => void;
  onStartGame: () => void;
}

export function MainMenuPage({ onLogout, onStartGame, username }: MainMenuPageProps) {
  return (
    <MenuScreen img={roboRallyImage} subtitle={`Pilot ${username}`} title="Main Menu">
      <div className="flex flex-col gap-3">
        <Button className="w-full" onClick={onStartGame} size="large">
          Start Training Run
        </Button>

        <Button className="w-full" disabled size="large" variant="secondary">
          Host Battle
        </Button>

        <Button className="w-full" disabled size="large" variant="secondary">
          Join Battle
        </Button>
      </div>

      <p className="m-0 text-center text-sm font-bold text-text-muted">Battle modes are coming next.</p>

      <Button className="w-full" onClick={onLogout} variant="secondary">
        Log Out
      </Button>
    </MenuScreen>
  );
}
