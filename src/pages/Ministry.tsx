import { useParams, Link } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { getCurrentValue } from '../core/kpi';
import type { Ministry as MinistryType } from '../types';

export default function Ministry() {
  const { id } = useParams<{ id: string }>();
  const { gameState } = useGame();

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

  const ministryKPIs = gameState.kpis.filter(k => k.ministry === id);

  return (
    <div className="min-h-screen p-6">
      <Link to="/" className="text-accent hover:underline mb-4 inline-block">
        ← Retour au tableau de bord
      </Link>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-4">{id}</h1>

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
                  Unité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ministryKPIs.map(kpi => {
                const value = getCurrentValue(kpi);
                return (
                  <tr key={kpi.kpiId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {kpi.label}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {value.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {kpi.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {kpi.source.name}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
