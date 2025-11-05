import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { GameState, Card, MonthlyReport } from '../types';
import { saveGame, loadGame } from '../data/db';
import { playCard, advanceMonth, generateMonthlyReport } from '../core/gameState';

interface GameContextType {
  gameState: GameState | null;
  setGameState: (state: GameState | null) => void;
  playCardAction: (cardId: string, optionIndex: number) => void;
  endMonth: () => void;
  currentReport: MonthlyReport | null;
  saveCurrentGame: () => Promise<void>;
  loadGameById: (saveId: string) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentReport, setCurrentReport] = useState<MonthlyReport | null>(null);

  // Generate report when game state changes
  useEffect(() => {
    if (gameState) {
      const report = generateMonthlyReport(gameState);
      setCurrentReport(report);
    }
  }, [gameState]);

  const playCardAction = (cardId: string, optionIndex: number) => {
    if (!gameState) return;

    try {
      const newState = playCard(gameState, cardId, optionIndex);
      setGameState(newState);
    } catch (error) {
      console.error('Error playing card:', error);
    }
  };

  const endMonth = () => {
    if (!gameState) return;

    try {
      const newState = advanceMonth(gameState);
      setGameState(newState);

      // Auto-save after each month
      saveGame(newState);
    } catch (error) {
      console.error('Error advancing month:', error);
    }
  };

  const saveCurrentGame = async () => {
    if (!gameState) return;
    await saveGame(gameState);
  };

  const loadGameById = async (saveId: string) => {
    const loaded = await loadGame(saveId);
    if (loaded) {
      setGameState(loaded);
    }
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        setGameState,
        playCardAction,
        endMonth,
        currentReport,
        saveCurrentGame,
        loadGameById,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}
