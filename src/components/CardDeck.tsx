import { useState } from 'react';
import type { Card, Ministry } from '../types';
import CardModal from './CardModal';

interface CardDeckProps {
  cards: Card[];
  onPlayCard: (cardId: string, optionIndex: number) => void;
  cardsPlayedThisMonth: number;
  maxCardsPerMonth: number;
  filterMinistry?: Ministry;
}

export default function CardDeck({ cards, onPlayCard, cardsPlayedThisMonth, maxCardsPerMonth, filterMinistry }: CardDeckProps) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [filter, setFilter] = useState<'all' | 'budget' | 'law' | 'decree' | 'diplomacy' | 'communication'>('all');

  const canPlayMoreCards = cardsPlayedThisMonth < maxCardsPerMonth;

  const filteredCards = cards.filter(card => {
    if (filter !== 'all' && card.type !== filter) return false;
    if (filterMinistry && !card.ministries.includes(filterMinistry)) return false;
    return true;
  });

  const handlePlayCard = (optionIndex: number) => {
    if (selectedCard && canPlayMoreCards) {
      onPlayCard(selectedCard.cardId, optionIndex);
      setSelectedCard(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Cartes Disponibles</h2>
          <p className="text-sm text-gray-600">
            {cardsPlayedThisMonth}/{maxCardsPerMonth} cartes jouées ce mois
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-sm ${filter === 'all' ? 'bg-accent text-white' : 'bg-gray-200'}`}
          >
            Toutes
          </button>
          <button
            onClick={() => setFilter('budget')}
            className={`px-3 py-1 rounded text-sm ${filter === 'budget' ? 'bg-accent text-white' : 'bg-gray-200'}`}
          >
            Budget
          </button>
          <button
            onClick={() => setFilter('law')}
            className={`px-3 py-1 rounded text-sm ${filter === 'law' ? 'bg-accent text-white' : 'bg-gray-200'}`}
          >
            Lois
          </button>
          <button
            onClick={() => setFilter('decree')}
            className={`px-3 py-1 rounded text-sm ${filter === 'decree' ? 'bg-accent text-white' : 'bg-gray-200'}`}
          >
            Décrets
          </button>
        </div>
      </div>

      {!canPlayMoreCards && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
          <p className="text-yellow-800">
            Vous avez atteint la limite de {maxCardsPerMonth} cartes pour ce mois.
            Cliquez sur "Fin du mois" pour continuer.
          </p>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCards.map(card => (
          <div
            key={card.cardId}
            className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
              !canPlayMoreCards ? 'opacity-50' : 'cursor-pointer'
            }`}
            onClick={() => canPlayMoreCards && setSelectedCard(card)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold">{card.title || card.cardId}</h3>
              <span className="text-xs bg-accent text-white px-2 py-1 rounded">{card.type}</span>
            </div>

            {card.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{card.description}</p>
            )}

            <div className="flex flex-wrap gap-1 mb-3">
              {card.ministries.slice(0, 2).map(m => (
                <span key={m} className="text-xs bg-gray-100 px-2 py-1 rounded">{m}</span>
              ))}
              {card.ministries.length > 2 && (
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  +{card.ministries.length - 2}
                </span>
              )}
            </div>

            <div className="text-xs text-gray-500">
              {card.options.length} options disponibles
            </div>
          </div>
        ))}
      </div>

      {filteredCards.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Aucune carte disponible avec ces filtres
        </div>
      )}

      {/* Card Modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onPlay={handlePlayCard}
          disabled={!canPlayMoreCards}
        />
      )}
    </div>
  );
}
