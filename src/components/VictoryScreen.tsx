import type { GameState } from '../types';
import { calculateIGG } from '../core/aggregators';

interface VictoryScreenProps {
  gameState: GameState;
  onNewGame: () => void;
}

export default function VictoryScreen({ gameState, onNewGame }: VictoryScreenProps) {
  const igg = calculateIGG(gameState.kpis, gameState.difficulty);
  const completedObjectives = gameState.selectedObjectives.length;
  const months = gameState.currentMonth + 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-8 text-center">
        {/* Victory Icon */}
        <div className="text-6xl mb-4">🎉</div>

        <h1 className="text-4xl font-bold text-success mb-4">
          Victoire !
        </h1>

        <p className="text-xl text-gray-700 mb-6">
          Vous avez réussi à gouverner la France pendant {months} mois et atteint vos objectifs !
        </p>

        {/* Statistics */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Bilan Final</h2>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div>
              <div className="text-sm text-gray-600">Indice Global de Gouvernement</div>
              <div className="text-2xl font-bold text-success">{igg}/100</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Objectifs Réalisés</div>
              <div className="text-2xl font-bold text-success">{completedObjectives}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Durée</div>
              <div className="text-2xl font-bold">{months} mois</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Dette / PIB</div>
              <div className="text-2xl font-bold">
                {((gameState.budget.debt / gameState.budget.gdp) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Completed Objectives */}
        <div className="mb-6 text-left">
          <h3 className="font-semibold mb-2">Objectifs Accomplis :</h3>
          <ul className="space-y-2">
            {gameState.selectedObjectives.map(objId => {
              const obj = gameState.objectives.find(o => o.objectiveId === objId);
              return (
                <li key={objId} className="flex items-center gap-2">
                  <span className="text-success">✓</span>
                  <span>{obj?.label || objId}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onNewGame}
            className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Nouvelle Partie
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-semibold"
          >
            Retour au Menu
          </button>
        </div>
      </div>
    </div>
  );
}
