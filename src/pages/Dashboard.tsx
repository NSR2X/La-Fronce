import { Link } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { MINISTRIES } from '../types';
import { calculateIPM } from '../core/aggregators';
import CardDeck from '../components/CardDeck';

export default function Dashboard() {
  const { gameState, currentReport, endMonth, loading, playCardAction, majorCardsPlayedThisMonth, communicationCardsPlayedThisMonth } = useGame();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Dernier Gouvernement</h1>
          <div className="animate-pulse">
            <div className="text-xl">Chargement de la partie...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Dernier Gouvernement</h1>
          <p className="text-alert">Erreur lors du chargement de la partie</p>
        </div>
      </div>
    );
  }

  const igg = currentReport?.igg || 50;
  const troikaLevel = 0; // Simplified

  return (
    <div className="min-h-screen p-6">
      {/* Topbar */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Mois {gameState.currentMonth + 1}</h1>
            <div className="text-sm text-gray-600">
              {gameState.startDate}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={endMonth}
              className="bg-accent text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Fin du mois
            </button>
            <Link
              to="/report"
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Rapport
            </Link>
            <Link
              to="/budget"
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Budget
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: IGG & Troika */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Indice Global de Gouvernement</h2>
            <div className="text-6xl font-bold text-center mb-4" style={{
              color: igg >= 60 ? '#16A34A' : igg >= 40 ? '#F59E0B' : '#DC2626'
            }}>
              {igg}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="h-4 rounded-full transition-all"
                style={{
                  width: `${igg}%`,
                  backgroundColor: igg >= 60 ? '#16A34A' : igg >= 40 ? '#F59E0B' : '#DC2626'
                }}
              />
            </div>
          </div>

          {/* Ministries Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MINISTRIES.map(ministry => {
              const ipm = calculateIPM(ministry, gameState.kpis);
              return (
                <Link
                  key={ministry}
                  to={`/ministry/${ministry}`}
                  className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-semibold mb-2">{ministry}</h3>
                  <div className="text-3xl font-bold" style={{
                    color: ipm >= 60 ? '#16A34A' : ipm >= 40 ? '#F59E0B' : '#DC2626'
                  }}>
                    {ipm}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">IPM</div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Objectives */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-lg font-bold mb-4">Objectifs</h2>
            {gameState.selectedObjectives.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun objectif sélectionné</p>
            ) : (
              <div className="space-y-3">
                {gameState.selectedObjectives.map(objId => {
                  const objective = gameState.objectives.find(o => o.objectiveId === objId);
                  if (!objective) return null;

                  const progress = currentReport?.objectivesProgress.find(
                    op => op.objectiveId === objId
                  );

                  return (
                    <div key={objId} className="border-l-4 border-accent pl-3">
                      <div className="font-medium text-sm">{objective.label}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {progress?.progressPct || 0}% complété
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="h-2 rounded-full bg-accent"
                          style={{ width: `${progress?.progressPct || 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Counters */}
          <div className="bg-white shadow-md rounded-lg p-4 mt-4">
            <h2 className="text-lg font-bold mb-4">Compteurs</h2>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Tension Sociale</span>
                  <span>{gameState.counters.ts}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-alert"
                    style={{ width: `${gameState.counters.ts}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Confiance Marchés</span>
                  <span>{gameState.counters.cm}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-success"
                    style={{ width: `${gameState.counters.cm}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Légitimité</span>
                  <span>{gameState.counters.leg}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-accent"
                    style={{ width: `${gameState.counters.leg}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Played Cards This Month */}
      {(majorCardsPlayedThisMonth + communicationCardsPlayedThisMonth) > 0 && (
        <div className="mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold mb-3">Cartes jouées ce mois</h3>
            <div className="space-y-2">
              {gameState.playedCards
                .filter(pc => pc.playedAt === gameState.currentMonth)
                .map((pc, idx) => {
                  const card = gameState.cards.find(c => c.cardId === pc.cardId);
                  const option = card?.options[pc.optionIndex];
                  return (
                    <div key={idx} className="bg-white rounded p-3 text-sm">
                      <div className="font-semibold">{card?.title || pc.cardId}</div>
                      <div className="text-gray-600">Option: {option?.label}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Card Deck - Full Width */}
      <div className="mt-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <CardDeck
            cards={gameState.cards}
            onPlayCard={playCardAction}
            majorCardsPlayed={majorCardsPlayedThisMonth}
            communicationCardsPlayed={communicationCardsPlayedThisMonth}
            maxMajorCards={2}
            maxCommunicationCards={1}
          />
        </div>
      </div>
    </div>
  );
}
