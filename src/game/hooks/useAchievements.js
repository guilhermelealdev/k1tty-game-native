// src/game/hooks/useAchievements.js
import { useEffect, useRef } from 'react';
import { useGame } from '../state/GameContext';
import { ACHIEVEMENTS } from '../data/achievements';
import { isAchieved } from '../data/achievementChecks';

export function useAchievements() {
  const { state, dispatch } = useGame();
  const checking = useRef(false);

  useEffect(() => {
    if (checking.current) return;
    if (state.currentSave === null) return;

    const unlocked = state.unlockedAchievements || [];
    const newly = [];

    for (const a of ACHIEVEMENTS) {
      if (unlocked.includes(a.id)) continue;
      if (isAchieved(a.id, state)) newly.push(a.id);
    }

    if (newly.length === 0) return;

    checking.current = true;
    newly.forEach(id => dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: id }));
    setTimeout(() => { checking.current = false; }, 0);
  }, [
    state.currentSave, state.flags, state.stats, state.installedPackages,
    state.theme, state.wifiConnected, state.tutorialCompleted, state.systemCorrupted,
    state.progress, state.unlockedAchievements, dispatch,
  ]);
}