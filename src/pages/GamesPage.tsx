import { useState } from 'react';
import Miner from '@/games/Miner';
import Crash from '@/games/Crash';
import SlotBook from '@/games/SlotBook';
import SlotMegaways from '@/games/SlotMegaways';

type GameId = 'miner' | 'crash' | 'slot_book' | 'slot_mega';

const GAMES: { id: GameId; name: string; emoji: string; tag: string }[] = [
  { id: 'miner',     name: 'Минёр',          emoji: '💣', tag: 'Навык'  },
  { id: 'crash',     name: 'Краш',           emoji: '🚀', tag: 'Хайп'  },
  { id: 'slot_book', name: 'Книга Удачи',    emoji: '📖', tag: 'Бонус' },
  { id: 'slot_mega', name: 'Megaways Blast', emoji: '🌟', tag: 'Mega×' },
];

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<GameId>('miner');

  return (
    <div className="animate-fade-in">
      <h1 className="font-oswald text-2xl gold-text tracking-wide mb-5">ИГРЫ</h1>

      {/* Game tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {GAMES.map(game => (
          <button
            key={game.id}
            onClick={() => setActiveGame(game.id)}
            className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-sm font-medium transition-all border ${
              activeGame === game.id
                ? 'gold-bg text-black border-transparent'
                : 'card-dark text-muted-foreground hover:text-foreground border-border hover:border-amber-500/30'
            }`}
          >
            <span className="text-2xl">{game.emoji}</span>
            <span className="font-oswald tracking-wide text-xs">{game.name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
              activeGame === game.id ? 'bg-black/20 text-black' : 'bg-amber-500/10 gold-text'
            }`}>
              {game.tag}
            </span>
          </button>
        ))}
      </div>

      {/* Active game — key ensures full remount on tab switch */}
      <div key={activeGame}>
        {activeGame === 'miner'     && <Miner />}
        {activeGame === 'crash'     && <Crash />}
        {activeGame === 'slot_book' && <SlotBook />}
        {activeGame === 'slot_mega' && <SlotMegaways />}
      </div>
    </div>
  );
}
