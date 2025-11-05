import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import {
  validateKPIDataset,
  validateCardsDataset,
  validateObjectivesDataset,
  validateDifficultyDataset,
  parseJSON,
} from '../data/validation';
import { saveImport, generateChecksum } from '../data/db';
import { createNewGame } from '../core/gameState';
import type { KPIDataset, CardsDataset, ObjectivesDataset, DifficultyDataset } from '../types';

export default function DataImport() {
  const { setGameState } = useGame();
  const [kpiData, setKpiData] = useState<KPIDataset | null>(null);
  const [cardsData, setCardsData] = useState<CardsDataset | null>(null);
  const [objectivesData, setObjectivesData] = useState<ObjectivesDataset | null>(null);
  const [difficultyData, setDifficultyData] = useState<DifficultyDataset | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileUpload = async (
    file: File,
    type: 'kpi' | 'cards' | 'objectives' | 'difficulty'
  ) => {
    const text = await file.text();
    const parsed = parseJSON(text);

    if (!parsed.success || !parsed.data) {
      setErrors([`Erreur de parsing JSON: ${parsed.error}`]);
      return;
    }

    let validationResult;
    switch (type) {
      case 'kpi':
        validationResult = validateKPIDataset(parsed.data);
        if (validationResult.valid) {
          setKpiData(parsed.data as KPIDataset);
          await saveImport('kpi', parsed.data as KPIDataset, generateChecksum(parsed.data));
        }
        break;
      case 'cards':
        validationResult = validateCardsDataset(parsed.data);
        if (validationResult.valid) {
          setCardsData(parsed.data as CardsDataset);
          await saveImport('cards', parsed.data as CardsDataset, generateChecksum(parsed.data));
        }
        break;
      case 'objectives':
        validationResult = validateObjectivesDataset(parsed.data);
        if (validationResult.valid) {
          setObjectivesData(parsed.data as ObjectivesDataset);
          await saveImport('objectives', parsed.data as ObjectivesDataset, generateChecksum(parsed.data));
        }
        break;
      case 'difficulty':
        validationResult = validateDifficultyDataset(parsed.data);
        if (validationResult.valid) {
          setDifficultyData(parsed.data as DifficultyDataset);
          await saveImport('difficulty', parsed.data as DifficultyDataset, generateChecksum(parsed.data));
        }
        break;
    }

    if (!validationResult.valid) {
      setErrors(validationResult.errors || ['Erreur de validation inconnue']);
      setSuccess(null);
    } else {
      setSuccess(`${type.toUpperCase()} importé avec succès`);
      setErrors([]);
    }
  };

  const startNewGame = () => {
    if (!kpiData || !cardsData || !objectivesData || !difficultyData) {
      setErrors(['Vous devez importer tous les fichiers avant de commencer']);
      return;
    }

    // For simplicity, select the first 3 objectives
    const selectedObjectives = objectivesData.objectives.slice(0, 3).map(o => o.objectiveId);

    const newGame = createNewGame(
      kpiData,
      cardsData,
      objectivesData,
      difficultyData,
      selectedObjectives
    );

    setGameState(newGame);
    setSuccess('Nouvelle partie créée!');
  };

  return (
    <div className="min-h-screen p-6">
      <Link to="/" className="text-accent hover:underline mb-4 inline-block">
        ← Retour au tableau de bord
      </Link>

      <h1 className="text-3xl font-bold mb-6">Import de Données</h1>

      {errors.length > 0 && (
        <div className="bg-alert/10 border border-alert text-alert p-4 rounded-lg mb-4">
          <h3 className="font-bold mb-2">Erreurs:</h3>
          <ul className="list-disc list-inside">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {success && (
        <div className="bg-success/10 border border-success text-success p-4 rounded-lg mb-4">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* KPI */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">KPI Dataset</h2>
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file, 'kpi');
            }}
            className="mb-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-blue-700"
          />
          {kpiData && (
            <div className="text-sm text-success">
              ✓ {kpiData.kpis.length} KPIs importés
            </div>
          )}
        </div>

        {/* Cards */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Cards Dataset</h2>
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file, 'cards');
            }}
            className="mb-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-blue-700"
          />
          {cardsData && (
            <div className="text-sm text-success">
              ✓ {cardsData.cards.length} cartes importées
            </div>
          )}
        </div>

        {/* Objectives */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Objectives Dataset</h2>
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file, 'objectives');
            }}
            className="mb-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-blue-700"
          />
          {objectivesData && (
            <div className="text-sm text-success">
              ✓ {objectivesData.objectives.length} objectifs importés
            </div>
          )}
        </div>

        {/* Difficulty */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Difficulty Dataset</h2>
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file, 'difficulty');
            }}
            className="mb-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-blue-700"
          />
          {difficultyData && (
            <div className="text-sm text-success">
              ✓ Mode {difficultyData.mode} importé
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Commencer une Nouvelle Partie</h2>
        <p className="text-gray-600 mb-4">
          Une fois tous les fichiers importés, vous pouvez démarrer une nouvelle partie.
        </p>
        <button
          onClick={startNewGame}
          disabled={!kpiData || !cardsData || !objectivesData || !difficultyData}
          className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Commencer la Partie
        </button>
      </div>
    </div>
  );
}
