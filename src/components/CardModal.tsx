import { useState } from 'react';
import type { Card, CardOption } from '../types';

interface CardModalProps {
  card: Card;
  onClose: () => void;
  onPlay: (optionIndex: number) => void;
  disabled?: boolean;
}

export default function CardModal({ card, onClose, onPlay, disabled }: CardModalProps) {
  const [selectedOption, setSelectedOption] = useState(0);
  const option = card.options[selectedOption];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">{card.title || card.cardId}</h2>
            <p className="text-sm text-gray-600">{card.description}</p>
            <div className="flex gap-2 mt-2">
              <span className="text-xs bg-accent text-white px-2 py-1 rounded">{card.type}</span>
              {card.ministries.map(m => (
                <span key={m} className="text-xs bg-gray-200 px-2 py-1 rounded">{m}</span>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Options Tabs */}
        <div className="border-b">
          <div className="flex gap-2 p-4">
            {card.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedOption(idx)}
                className={`px-4 py-2 rounded-t ${
                  selectedOption === idx
                    ? 'bg-accent text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Option Details */}
        <div className="p-6">
          {/* Costs */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-3">Coûts</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-600">Budget</div>
                <div className="font-bold">{option.costs.eur > 0 ? '+' : ''}{option.costs.eur} Md€</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-600">Capital Politique</div>
                <div className="font-bold text-alert">-{option.costs.cp}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-600">Légitimité</div>
                <div className="font-bold text-alert">-{option.costs.leg}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-600">Risques Juridiques</div>
                <div className="font-bold text-alert">+{option.costs.rj}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-600">Confiance Marchés</div>
                <div className="font-bold text-alert">-{option.costs.cm}</div>
              </div>
            </div>
          </div>

          {/* Lags */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-3">Délais d'Application</h3>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-gray-600">Début:</span>{' '}
                <span className="font-bold">{option.lags.start} mois</span>
              </div>
              <div>
                <span className="text-gray-600">Rampe:</span>{' '}
                <span className="font-bold">{option.lags.ramp} mois</span>
              </div>
              <div>
                <span className="text-gray-600">Durée:</span>{' '}
                <span className="font-bold">{option.lags.duration} mois</span>
              </div>
            </div>
          </div>

          {/* Effects */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-3">Effets sur les KPI</h3>
            <div className="space-y-3">
              {option.effects.map((effect, idx) => (
                <div key={idx} className="border rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold">{effect.kpiId}</div>
                    <div className={`text-sm px-2 py-1 rounded ${
                      effect.confidence === 'high' ? 'bg-success text-white' :
                      effect.confidence === 'med' ? 'bg-yellow-500 text-white' :
                      'bg-gray-400 text-white'
                    }`}>
                      {effect.confidence === 'high' ? 'Haute confiance' :
                       effect.confidence === 'med' ? 'Confiance moyenne' :
                       'Faible confiance'}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Delta:</span>{' '}
                      {effect.delta > 0 ? '+' : ''}{effect.delta}
                    </div>
                    <div>
                      <span className="font-medium">Intervalle:</span>{' '}
                      [{effect.interval.min}, {effect.interval.max}]
                    </div>
                    <div>
                      <span className="font-medium">Profil:</span>{' '}
                      {effect.profile}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risks with Gauges */}
          {option.risks && (option.risks.probRJ || option.risks.probStrike) && (
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-3">Risques</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {option.risks.probRJ && (
                  <div className="bg-alert/10 border border-alert rounded p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-semibold text-gray-700">Risques Juridiques</div>
                      <div className="font-bold text-alert">{(option.risks.probRJ * 100).toFixed(0)}%</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-alert transition-all"
                        style={{ width: `${option.risks.probRJ * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      Probabilité de contentieux ou recours
                    </div>
                  </div>
                )}
                {option.risks.probStrike && (
                  <div className="bg-orange-50 border border-orange-500 rounded p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-semibold text-gray-700">Risque de Grève</div>
                      <div className="font-bold text-orange-600">{(option.risks.probStrike * 100).toFixed(0)}%</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-orange-500 transition-all"
                        style={{ width: `${option.risks.probStrike * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      Probabilité de mobilisations sociales
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={() => onPlay(selectedOption)}
            disabled={disabled}
            className="px-6 py-2 bg-accent text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Appliquer cette option
          </button>
        </div>
      </div>
    </div>
  );
}
