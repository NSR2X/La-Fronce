import { useParams, Link } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { getCurrentValue, getLastNValues, calculateTrend, normalizeKPI } from '../core/kpi';
import { calculateIPM } from '../core/aggregators';
import CardDeck from '../components/CardDeck';
import type { KPI } from '../types';

export default function Ministry() {
  const { id } = useParams<{ id: string }>();
  const { gameState, playCardAction, majorCardsPlayedThisMonth, communicationCardsPlayedThisMonth } = useGame();

  if (!gameState || !id) {
    return (
      <div className="min-h-screen p-6">
        <Link to="/" className="text-accent hover:underline mb-4 inline-block">
          ← Retour au tableau de bord
        </Link>
        <p>Ministère non trouvé</p>
      </div>
    );
  }

  const ministry = id as any; // Ministry type
  const ministryKPIs = gameState.kpis.filter(k => k.ministry === ministry);
  const ipm = calculateIPM(ministry, gameState.kpis);

  // Helper to calculate monthly delta
  const getMonthlyDelta = (kpi: KPI): number | null => {
    if (kpi.history.length < 2) return null;
    const lastTwo = getLastNValues(kpi, 2);
    if (lastTwo.length < 2) return null;
    return lastTwo[1] - lastTwo[0];
  };

  // Helper to get trend indicator
  const getTrendIndicator = (kpi: KPI): string => {
    const values = getLastNValues(kpi, 3);
    if (values.length < 2) return '→';
    const trend = calculateTrend(values);
    if (trend > 0.5) return '↗';
    if (trend < -0.5) return '↘';
    return '→';
  };

  // Helper to get confidence band
  const getConfidenceBand = (kpi: KPI): string => {
    const normalized = normalizeKPI(getCurrentValue(kpi), kpi);
    if (normalized >= 0.7) return 'Bon';
    if (normalized >= 0.4) return 'Moyen';
    return 'Faible';
  };

  // Helper to get confidence color
  const getConfidenceColor = (band: string): string => {
    if (band === 'Bon') return 'text-green-600 bg-green-50';
    if (band === 'Moyen') return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  // Get IPM color
  const ipmColor = ipm >= 60 ? '#16A34A' : ipm >= 40 ? '#F59E0B' : '#DC2626';

  // Filter cards relevant to this ministry
  const ministryCards = gameState.cards.filter(card =>
    card.ministries.includes(ministry) || card.ministries.length === 0
  );

  return (
    <div className="min-h-screen p-6">
      <Link to="/" className="text-accent hover:underline mb-4 inline-block">
        ← Retour au tableau de bord
      </Link>

      {/* IPM Header */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{ministry}</h1>
          <div className="text-center">
            <div className="text-5xl font-bold" style={{ color: ipmColor }}>
              {ipm}
            </div>
            <div className="text-sm text-gray-500 mt-1">IPM</div>
          </div>
        </div>
      </div>

      {/* KPI Table */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Indicateurs de Performance</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  KPI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valeur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Δm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tendance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confiance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ministryKPIs.map(kpi => {
                const value = getCurrentValue(kpi);
                const delta = getMonthlyDelta(kpi);
                const trend = getTrendIndicator(kpi);
                const confidenceBand = getConfidenceBand(kpi);
                const confidenceColor = getConfidenceColor(confidenceBand);

                return (
                  <tr key={kpi.kpiId}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {kpi.label}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {value.toFixed(2)} {kpi.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {delta !== null ? (
                        <span className={delta >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {delta >= 0 ? '+' : ''}{delta.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-2xl text-center">
                      {trend}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${confidenceColor}`}>
                        {confidenceBand}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {kpi.source.url ? (
                        <a
                          href={kpi.source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline"
                        >
                          {kpi.source.name}
                        </a>
                      ) : (
                        kpi.source.name
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suggested Cards */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Cartes Suggérées</h2>
        <CardDeck
          cards={ministryCards}
          onPlayCard={playCardAction}
          majorCardsPlayed={majorCardsPlayedThisMonth}
          communicationCardsPlayed={communicationCardsPlayedThisMonth}
          maxMajorCards={2}
          maxCommunicationCards={1}
          filterMinistry={ministry}
        />
      </div>
    </div>
  );
}
