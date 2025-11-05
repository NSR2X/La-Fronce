import { Link } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export default function StressTest() {
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

  return (
    <div className="min-h-screen p-6">
      <Link to="/" className="text-accent hover:underline mb-4 inline-block">
        ← Retour au tableau de bord
      </Link>

      <h1 className="text-3xl font-bold mb-6">Tests de Sensibilité</h1>

      <div className="bg-white shadow-md rounded-lg p-6">
        <p className="text-gray-600 mb-4">
          Cette fonctionnalité permet de tester la sensibilité du système à différents paramètres exogènes
          (taux d'intérêt, prix de l'énergie, climat, etc.).
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taux d'Intérêt (%)
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              defaultValue="3"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prix de l'Énergie (€/MWh)
            </label>
            <input
              type="range"
              min="50"
              max="500"
              step="10"
              defaultValue="100"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Événements Climatiques (fréquence)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              defaultValue="20"
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Résultats Simulés</h3>
          <p className="text-sm text-gray-600">
            Les résultats de simulation apparaîtront ici une fois les paramètres ajustés.
          </p>
        </div>
      </div>
    </div>
  );
}
