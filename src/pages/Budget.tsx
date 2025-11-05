import { Link } from 'react-router-dom';
import { useGame } from '../context/GameContext';

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

  return (
    <div className="min-h-screen p-6">
      <Link to="/" className="text-accent hover:underline mb-4 inline-block">
        ← Retour au tableau de bord
      </Link>

      <h1 className="text-3xl font-bold mb-6">Budget</h1>

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

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Visualisation</h2>
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
    </div>
  );
}
