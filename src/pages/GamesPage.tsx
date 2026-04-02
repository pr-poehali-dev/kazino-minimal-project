import { useState } from 'react';
import Miner from '@/games/Miner';
import Crash from '@/games/Crash';
import SlotClassic from '@/games/SlotClassic';
import SlotFruit from '@/games/SlotFruit';

type GameId = 'miner' | 'crash' | 'slot1' | 'slot2';

const GAMES = [
  { id: 'miner' as GameId, name: 'Минёр', emoji: '💣', tag: 'Навык' },
  { id: 'crash' as GameId, name: 'Краш', emoji: '🚀', tag: 'Хайп' },
  { id: 'slot1' as GameId, name: 'Слот Классик', emoji: '🎰', tag: 'Классик' },
  { id: 'slot2' as GameId, name: 'Слот Фрукты', emoji: '🍒', tag: 'Фрукты' },
];

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<GameId>('miner');

  return (
    <div className="animate-fade-in">
      <h1 className="font-oswald text-2xl gold-text tracking-wide mb-6">ИГРЫ</h1>

      {/* Game tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {GAMES.map(game => (
          <button
            key={game.id}
            onClick={() => setActiveGame(game.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeGame === game.id
                ? 'btn-gold'
                : 'card-dark text-muted-foreground hover:text-foreground hover:border-amber-500/20'
            }`}
          >
            <span>{game.emoji}</span>
            {game.name}
          </button>
        ))}
      </div>

      {/* Active game — key ensures full remount on tab switch */}
      <div key={activeGame}>
        {activeGame === 'miner' && <Miner />}
        {activeGame === 'crash' && <Crash />}
        {activeGame === 'slot1' && <SlotClassic />}
        {activeGame === 'slot2' && <SlotFruit />}
      </div>
    </div>
  );
}