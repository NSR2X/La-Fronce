import { Link } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { MINISTRIES } from '../types';

export default function Budget() {
  const { gameState } = useGame();

  if (!gameState) {
    return (
      <div className="min-h-screen p-6">
        <Link to="/" className="text-accent hover:underline mb-4 inline-block">
          ← Retour au tableau de bord
        </Link>
        <p>Aucune partie en cours</p>
      </div>
    );
  }

  const { budget } = gameState;
  const balance = budget.revenue - budget.spending;
  const deficitPct = (Math.abs(balance) / budget.gdp) * 100;
  const debtPct = (budget.debt / budget.gdp) * 100;

  // Calculate ministry spending from played cards this year
  const ministrySpending: Record<string, number> = {};
  const currentYear = Math.floor(gameState.currentMonth / 12);
  const yearStartMonth = currentYear * 12;

  gameState.playedCards
    .filter(pc => pc.playedAt >= yearStartMonth)
    .forEach(pc => {
      const card = gameState.cards.find(c => c.cardId === pc.cardId);
      if (card && card.ministries.length > 0) {
        const option = card.options[pc.optionIndex];
        card.ministries.forEach(ministry => {
          ministrySpending[ministry] = (ministrySpending[ministry] || 0) + option.costs.eur;
        });
      }
    });

  const totalMinistrySpending = Object.values(ministrySpending).reduce((sum, amt) => sum + amt, 0);

  // Calculate active effects budget impact
  const activeEffects = gameState.scheduledEffects.filter(se => {
    const monthsSince = gameState.currentMonth - se.appliedAt;
    const effectEnd = se.lags.start + se.lags.ramp + se.lags.duration - 1;
    return monthsSince >= se.lags.start && monthsSince <= effectEnd;
  });

  return (
    <div className="min-h-screen p-6">
      <Link to="/" className="text-accent hover:underline mb-4 inline-block">
        ← Retour au tableau de bord
      </Link>

      <h1 className="text-3xl font-bold mb-6">Budget</h1>

      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-2">Recettes</div>
          <div className="text-3xl font-bold text-success">{budget.revenue} Md€</div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-2">Dépenses</div>
          <div className="text-3xl font-bold text-alert">{budget.spending} Md€</div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-2">Solde</div>
          <div className={`text-3xl font-bold ${balance >= 0 ? 'text-success' : 'text-alert'}`}>
            {balance >= 0 ? '+' : ''}{balance} Md€
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {deficitPct.toFixed(1)}% du PIB
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-2">Dette publique</div>
          <div className="text-3xl font-bold text-gray-700">{budget.debt} Md€</div>
          <div className="text-xs text-gray-500 mt-1">
            {debtPct.toFixed(1)}% du PIB
          </div>
        </div>
      </div>

      {/* Global Visualization */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Vue d'ensemble</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Recettes vs Dépenses</span>
              <span>{balance >= 0 ? 'Excédent' : 'Déficit'}</span>
            </div>
            <div className="flex gap-2 h-8">
              <div
                className="bg-success rounded flex items-center justify-center text-white text-sm"
                style={{ width: `${(budget.revenue / (budget.revenue + budget.spending)) * 100}%` }}
              >
                Recettes
              </div>
              <div
                className="bg-alert rounded flex items-center justify-center text-white text-sm"
                style={{ width: `${(budget.spending / (budget.revenue + budget.spending)) * 100}%` }}
              >
                Dépenses
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Dette / PIB</span>
              <span>{debtPct.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-8">
              <div
                className="h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm"
                style={{ width: `${Math.min(debtPct, 100)}%` }}
              >
                {debtPct.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ministry Spending YTD */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Dépenses par Ministère (Année en cours)</h2>
        {Object.keys(ministrySpending).length > 0 ? (
          <div className="space-y-3">
            {MINISTRIES.map(ministry => {
              const spending = ministrySpending[ministry] || 0;
              const percentage = totalMinistrySpending > 0
                ? (spending / totalMinistrySpending) * 100
                : 0;

              if (spending === 0) return null;

              return (
                <div key={ministry}>
                  <div className="flex justify-between mb-1 text-sm">
                    <span className="font-medium">{ministry}</span>
                    <span className="text-gray-600">{spending.toFixed(1)} Md€</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6">
                    <div
                      className="h-6 rounded-full bg-accent flex items-center px-3 text-white text-xs font-semibold"
                      style={{ width: `${percentage}%` }}
                    >
                      {percentage >= 10 && `${percentage.toFixed(0)}%`}
                    </div>
                  </div>
                </div>
              );
            }).filter(Boolean)}
            <div className="pt-3 border-t text-sm font-semibold">
              <div className="flex justify-between">
                <span>Total</span>
                <span>{totalMinistrySpending.toFixed(1)} Md€</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Aucune dépense ministérielle enregistrée pour cette année.</p>
        )}
      </div>

      {/* Active Effects Impact */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Effets actifs ({activeEffects.length})</h2>
        {activeEffects.length > 0 ? (
          <div className="space-y-3">
            {activeEffects.slice(0, 10).map((se, idx) => {
              const card = gameState.cards.find(c =>
                c.options.some(opt =>
                  opt.effects.some(eff => eff.kpiId === se.effect.kpiId)
                )
              );
              const monthsSince = gameState.currentMonth - se.appliedAt;
              const remainingMonths = se.lags.start + se.lags.ramp + se.lags.duration - monthsSince;

              return (
                <div key={idx} className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{card?.title || se.effect.kpiId}</div>
                    <div className="text-xs text-gray-600">
                      KPI: {se.effect.kpiId} • Delta: {se.effect.delta > 0 ? '+' : ''}{se.effect.delta}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-accent">
                      {remainingMonths} mois restants
                    </div>
                  </div>
                </div>
              );
            })}
            {activeEffects.length > 10 && (
              <p className="text-sm text-gray-500 text-center">
                ... et {activeEffects.length - 10} autres effets
              </p>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Aucun effet actif actuellement.</p>
        )}
      </div>
    </div>
  );
}
