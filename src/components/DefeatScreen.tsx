import type { GameState } from '../types';
import { calculateIGG } from '../core/aggregators';

interface DefeatScreenProps {
  gameState: GameState;
  onNewGame: () => void;
}

export default function DefeatScreen({ gameState, onNewGame }: DefeatScreenProps) {
  const igg = calculateIGG(gameState.kpis, gameState.difficulty);
  const months = gameState.currentMonth + 1;
  const reason = gameState.defeatReason || 'Conditions économiques critiques';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-8 text-center">
        {/* Defeat Icon */}
        <div className="text-6xl mb-4">📉</div>

        <h1 className="text-4xl font-bold text-alert mb-4">
          Intervention de la Troïka
        </h1>

        <p className="text-xl text-gray-700 mb-4">
          Votre gouvernement n'a pu se maintenir que {months} mois.
        </p>

        {/* Reason */}
        <div className="bg-red-50 border-l-4 border-alert p-4 mb-6 text-left">
          <h3 className="font-semibold text-alert mb-2">Motif de l'intervention :</h3>
          <p className="text-gray-700">{reason}</p>
        </div>

        {/* Statistics */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Statistiques Finales</h2>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div>
              <div className="text-sm text-gray-600">Indice Global de Gouvernement</div>
              <div className="text-2xl font-bold text-alert">{igg}/100</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Durée</div>
              <div className="text-2xl font-bold">{months} mois</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Dette / PIB</div>
              <div className="text-2xl font-bold text-alert">
                {((gameState.budget.debt / gameState.budget.gdp) * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Déficit / PIB</div>
              <div className="text-2xl font-bold text-alert">
                {(((gameState.budget.spending - gameState.budget.revenue) / gameState.budget.gdp) * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Tension Sociale</div>
              <div className="text-2xl font-bold">{gameState.counters.ts}/100</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Confiance Marchés</div>
              <div className="text-2xl font-bold">{gameState.counters.cm}/100</div>
            </div>
          </div>
        </div>

        {/* Failed Objectives */}
        {gameState.selectedObjectives.length > 0 && (
          <div className="mb-6 text-left">
            <h3 className="font-semibold mb-2">Objectifs Non Atteints :</h3>
            <ul className="space-y-2">
              {gameState.selectedObjectives.map(objId => {
                const obj = gameState.objectives.find(o => o.objectiveId === objId);
                return (
                  <li key={objId} className="flex items-center gap-2 text-gray-600">
                    <span className="text-alert">✗</span>
                    <span>{obj?.label || objId}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onNewGame}
            className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Réessayer
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
