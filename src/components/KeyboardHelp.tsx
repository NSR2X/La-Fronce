import { useState, useEffect } from 'react';

export default function KeyboardHelp() {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        setShowHelp(prev => !prev);
      } else if (e.key === 'Escape' && showHelp) {
        setShowHelp(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showHelp]);

  if (!showHelp) {
    return (
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-700 shadow-lg z-50"
        title="Raccourcis clavier (appuyez sur ?)"
      >
        ?
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Raccourcis Clavier</h2>
          <button
            onClick={() => setShowHelp(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3 text-lg">Navigation Pages</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">G</kbd>
                <span>Dashboard</span>
              </div>
              <div className="flex justify-between">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">B</kbd>
                <span>Budget</span>
              </div>
              <div className="flex justify-between">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">R</kbd>
                <span>Rapport</span>
              </div>
              <div className="flex justify-between">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">D</kbd>
                <span>Données</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-lg">Ministères</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">1-9</kbd>
                <span>Ministères 1-9</span>
              </div>
              <div className="flex justify-between">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">A</kbd>
                <span>Foreign/EU</span>
              </div>
              <div className="flex justify-between">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">Z</kbd>
                <span>Defense</span>
              </div>
              <div className="flex justify-between">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">E</kbd>
                <span>Culture/Youth/Sport</span>
              </div>
              <div className="flex justify-between">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">T</kbd>
                <span>Digital Sovereignty</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-semibold mb-3 text-lg">Modal & Général</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">Esc</kbd>
                <span>Fermer modal / Annuler</span>
              </div>
              <div className="flex justify-between">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">Enter</kbd>
                <span>Valider</span>
              </div>
              <div className="flex justify-between">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">?</kbd>
                <span>Afficher/Masquer cette aide</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t text-sm text-gray-600 text-center">
          Les raccourcis ne fonctionnent pas dans les champs de saisie
        </div>
      </div>
    </div>
  );
}
