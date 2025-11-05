import { Link } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export default function Report() {
  const { gameState, currentReport } = useGame();

  if (!gameState || !currentReport) {
    return (
      <div className="min-h-screen p-6">
        <Link to="/" className="text-accent hover:underline mb-4 inline-block">
          ← Retour au tableau de bord
        </Link>
        <p>Aucun rapport disponible</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <Link to="/" className="text-accent hover:underline mb-4 inline-block">
        ← Retour au tableau de bord
      </Link>

      <h1 className="text-3xl font-bold mb-6">Rapport Mensuel - Mois {currentReport.month + 1}</h1>

      {/* Objectifs */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Objectifs</h2>
        {currentReport.objectivesProgress.length === 0 ? (
          <p className="text-gray-500">Aucun objectif sélectionné</p>
        ) : (
          <div className="space-y-4">
            {currentReport.objectivesProgress.map(progress => (
              <div key={progress.objectiveId} className="border-l-4 border-accent pl-4">
                <div className="font-semibold">{progress.label}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Progression: {progress.progressPct}%
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${progress.overallPassed ? 'bg-success' : 'bg-gray-400'}`}
                      style={{ width: `${progress.progressPct}%` }}
                    />
                  </div>
                </div>
                <div className="mt-2 text-xs">
                  {progress.checksStatus.map((check, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span>{check.passed ? '✓' : '✗'}</span>
                      <span>Critère {idx + 1}</span>
                      {check.currentValue !== undefined && (
                        <span className="text-gray-500">
                          (actuel: {check.currentValue.toFixed(2)}
                          {check.targetValue !== undefined && ` / cible: ${check.targetValue.toFixed(2)}`})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Budget Summary */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Synthèse Budget</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">Recettes</div>
            <div className="text-2xl font-bold text-success">
              {currentReport.budgetSummary.revenue} Md€
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Dépenses</div>
            <div className="text-2xl font-bold text-alert">
              {currentReport.budgetSummary.spending} Md€
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Solde</div>
            <div className={`text-2xl font-bold ${currentReport.budgetSummary.balance >= 0 ? 'text-success' : 'text-alert'}`}>
              {currentReport.budgetSummary.balance >= 0 ? '+' : ''}
              {currentReport.budgetSummary.balance} Md€
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Dette</div>
            <div className="text-2xl font-bold text-gray-700">
              {currentReport.budgetSummary.debt} Md€
            </div>
          </div>
        </div>
      </div>

      {/* Ministries */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Performance des Ministères</h2>
        <div className="space-y-2">
          {currentReport.ministries
            .sort((a, b) => a.ipm - b.ipm)
            .map(ministry => (
              <div key={ministry.ministry} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="font-semibold">{ministry.ministry}</div>
                </div>
                <div className="w-32">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="h-4 rounded-full"
                      style={{
                        width: `${ministry.ipm}%`,
                        backgroundColor: ministry.ipm >= 60 ? '#16A34A' : ministry.ipm >= 40 ? '#F59E0B' : '#DC2626'
                      }}
                    />
                  </div>
                </div>
                <div className="w-12 text-right font-bold">
                  {ministry.ipm}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Cards Played */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Cartes Jouées ce Mois</h2>
        {currentReport.cardsPlayed.length === 0 ? (
          <p className="text-gray-500">Aucune carte jouée ce mois</p>
        ) : (
          <ul className="list-disc list-inside space-y-2">
            {currentReport.cardsPlayed.map((played, idx) => {
              const card = gameState.cards.find(c => c.cardId === played.cardId);
              return (
                <li key={idx}>
                  {card?.title || card?.cardId} - Option {played.optionIndex + 1}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
