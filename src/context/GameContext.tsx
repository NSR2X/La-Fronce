import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { GameState, MonthlyReport } from '../types';
import { saveGame, loadGame, listGames } from '../data/db';
import { playCard, advanceMonth, generateMonthlyReport, createNewGame } from '../core/gameState';

// Import default datasets
import defaultKpiData from '../data/default-kpi.json';
import defaultCardsData from '../data/default-cards.json';
import defaultObjectivesData from '../data/default-objectives.json';
import defaultDifficultyData from '../data/default-difficulty.json';

interface GameContextType {
  gameState: GameState | null;
  setGameState: (state: GameState | null) => void;
  playCardAction: (cardId: string, optionIndex: number) => void;
  endMonth: () => void;
  currentReport: MonthlyReport | null;
  saveCurrentGame: () => Promise<void>;
  loadGameById: (saveId: string) => Promise<void>;
  startNewGame: () => Promise<void>;
  loading: boolean;
  cardsPlayedThisMonth: number;
  majorCardsPlayedThisMonth: number;
  communicationCardsPlayedThisMonth: number;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentReport, setCurrentReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-load or create default game on mount
  useEffect(() => {
    const initGame = async () => {
      try {
        // Check if there are any existing games
        const existingGames = await listGames();

        if (existingGames.length > 0) {
          // Load the most recent game
          const latestGame = existingGames[existingGames.length - 1];
          setGameState(latestGame);
        } else {
          // Create a new default game with embedded datasets
          const selectedObjectives = defaultObjectivesData.objectives
            .slice(0, 3)
            .map(o => o.objectiveId);

          const newGame = createNewGame(
            defaultKpiData,
            defaultCardsData,
            defaultObjectivesData,
            defaultDifficultyData,
            selectedObjectives
          );

          await saveGame(newGame);
          setGameState(newGame);
        }
      } catch (error) {
        console.error('Error initializing game:', error);
      } finally {
        setLoading(false);
      }
    };

    initGame();
  }, []);

  // Generate report when game state changes
  useEffect(() => {
    if (gameState) {
      try {
        const report = generateMonthlyReport(gameState);
        setCurrentReport(report);
      } catch (error) {
        console.error('Error generating report:', error);
      }
    }
  }, [gameState]);

  const playCardAction = (cardId: string, optionIndex: number) => {
    if (!gameState) return;

    try {
      const newState = playCard(gameState, cardId, optionIndex);
      setGameState(newState);
      // Auto-save after playing a card
      saveGame(newState);
    } catch (error) {
      console.error('Error playing card:', error);
    }
  };

  // Count cards played this month
  const cardsPlayedThisMonth = gameState
    ? gameState.playedCards.filter(pc => pc.playedAt === gameState.currentMonth).length
    : 0;

  // Count major cards (budget, law, decree, diplomacy) and communication cards separately
  const majorCardsPlayedThisMonth = gameState
    ? gameState.playedCards.filter(pc => {
        if (pc.playedAt !== gameState.currentMonth) return false;
        const card = gameState.cards.find(c => c.cardId === pc.cardId);
        return card && ['budget', 'law', 'decree', 'diplomacy'].includes(card.type);
      }).length
    : 0;

  const communicationCardsPlayedThisMonth = gameState
    ? gameState.playedCards.filter(pc => {
        if (pc.playedAt !== gameState.currentMonth) return false;
        const card = gameState.cards.find(c => c.cardId === pc.cardId);
        return card && card.type === 'communication';
      }).length
    : 0;

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

  const startNewGame = async () => {
    // Create fresh game with default datasets
    const selectedObjectives = defaultObjectivesData.objectives
      .slice(0, 3)
      .map(o => o.objectiveId);

    const newGame = createNewGame(
      defaultKpiData,
      defaultCardsData,
      defaultObjectivesData,
      defaultDifficultyData,
      selectedObjectives
    );

    await saveGame(newGame);
    setGameState(newGame);
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
        startNewGame,
        loading,
        cardsPlayedThisMonth,
        majorCardsPlayedThisMonth,
        communicationCardsPlayedThisMonth,
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
