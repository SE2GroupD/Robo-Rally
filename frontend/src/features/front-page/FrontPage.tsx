import roboRallyImage from '../../assets/hero.png';
import { Button } from '../../foundation/components/button/Button';
import { MenuScreen } from '../../shared/components/menu-screen/MenuScreen';

interface FrontPageProps {
  onLoginClick: () => void;
}

export function FrontPage({ onLoginClick }: FrontPageProps) {
  return (
    <MenuScreen img={roboRallyImage} panelClassName="max-w-sm text-center" subtitle="Robot Battle Command" title="Robo Rally">
      <Button className="w-full" onClick={onLoginClick} size="large" variant="primary">
        Start Game
      </Button>
    </MenuScreen>
  );
}
