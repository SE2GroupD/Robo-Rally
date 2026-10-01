import { useEffect, useRef, useState } from 'react';
import type { BoardStateDto, RobotStateDto, TurnResolutionDto } from '../types/GameStateDto';

const STEP_DELAY_MS = 350;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Tiles a robot passes through going from `from` to `to` (straight lines only).
// Once conveyors/pits exist, have the server send the path instead.
function tilesBetween(from: { x: number; y: number }, to: { x: number; y: number }) {
  const tiles: { x: number; y: number }[] = [];
  let { x, y } = from;
  const dx = Math.sign(to.x - x);
  const dy = Math.sign(to.y - y);
  while (x !== to.x || y !== to.y) {
    if (x !== to.x) x += dx;
    else y += dy;
    tiles.push({ x, y });
  }
  return tiles;
}

/**
 * Turns the server's state into what to draw. When a new round resolves, it
 * replays the server's register-by-register results as an animation; otherwise
 * it just mirrors the server's robots. It never computes game rules.
 */
export function useGameReplay(state: BoardStateDto | null) {
  const [robots, setRobots] = useState<RobotStateDto[]>([]);
  const [isReplaying, setIsReplaying] = useState(false);
  const animatedRound = useRef<number | null>(null);
  const replaying = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!state || replaying.current) return;
    const resolution = state.lastResolution;

    // First load (or page refresh): show the current state, don't replay history.
    if (animatedRound.current === null) {
      animatedRound.current = resolution?.round ?? 0;
      setRobots(state.robots);
      return;
    }

    if (resolution && resolution.round > animatedRound.current) {
      animatedRound.current = resolution.round;
      replaying.current = true;
      setIsReplaying(true);
      void replay(resolution).finally(() => {
        replaying.current = false;
        if (mounted.current) setIsReplaying(false); // effect re-runs and syncs to final state
      });
      return;
    }

    setRobots(state.robots);

    async function replay(res: TurnResolutionDto) {
      const current = new Map(res.startingRobots.map((r) => [r.playerId, { ...r }]));
      setRobots([...current.values()].map((r) => ({ ...r })));
      await sleep(STEP_DELAY_MS);

      for (const step of res.steps) {
        const paths = step.robots.map((s) => ({
          step: s,
          tiles: tilesBetween(current.get(s.playerId) ?? s, s),
        }));
        const frames = Math.max(1, ...paths.map((p) => p.tiles.length));
        for (let frame = 0; frame < frames; frame++) {
          for (const { step: s, tiles } of paths) {
            const tile = tiles[Math.min(frame, tiles.length - 1)] ?? { x: s.x, y: s.y };
            current.set(s.playerId, { playerId: s.playerId, x: tile.x, y: tile.y, direction: s.direction });
          }
          if (!mounted.current) return;
          setRobots([...current.values()].map((r) => ({ ...r })));
          await sleep(STEP_DELAY_MS);
        }
      }
    }
  }, [state]);

  return {
    robots,
    isReplaying,
    /** The round the player may program now, or null while a replay is playing. */
    programmingRound: isReplaying || !state ? null : state.round,
  };
}
