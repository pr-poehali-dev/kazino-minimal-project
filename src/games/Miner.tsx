import { useState } from 'react';
import { casinoStore, useCasino } from '@/store/casinoStore';
import Icon from '@/components/ui/icon';

const GRID_SIZE = 25;
const MINE_COUNTS = [3, 5, 8, 12, 15, 20];

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
}

const MULTIPLIERS: Record<number, number[]> = {
  3: [1.05, 1.12, 1.19, 1.27, 1.37, 1.49, 1.63, 1.80, 2.00, 2.25, 2.57, 2.97, 3.49, 4.17, 5.10, 6.44, 8.44, 11.57, 16.82, 26.47, 45.95],
  5: [1.09, 1.20, 1.34, 1.51, 1.72, 1.98, 2.31, 2.73, 3.28, 4.00, 4.97, 6.30, 8.17, 10.88, 14.96, 21.40, 32.09, 51.35, 89.37, 175.42],
  8: [1.16, 1.36, 1.62, 1.95, 2.37, 2.92, 3.65, 4.62, 5.94, 7.76, 10.32, 14.01, 19.43, 27.74, 41.10, 64.08, 106.8],
  12: [1.28, 1.67, 2.20, 2.96, 4.03, 5.59, 7.91, 11.40, 16.80, 25.30, 39.20, 62.7, 104.5],
  15: [1.45, 2.11, 3.12, 4.70, 7.24, 11.38, 18.27, 30.07, 50.99, 89.23, 161.8],
  20: [2.25, 5.14, 12.86, 34.29, 102.9, 360.1, 1801],
};

function generateGrid(mineCount: number): Cell[] {
  const cells: Cell[] = Array.from({ length: GRID_SIZE }, () => ({ isMine: false, isRevealed: false }));
  let placed = 0;
  while (placed < mineCount) {
    const idx = Math.floor(Math.random() * GRID_SIZE);
    if (!cells[idx].isMine) { cells[idx].isMine = true; placed++; }
  }
  return cells;
}

export default function Miner() {
  const { currentUser } = useCasino();
  const [bet, setBet] = useState(100);
  const [mines, setMines] = useState(5);
  const [grid, setGrid] = useState<Cell[]>([]);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [safeCount, setSafeCount] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [profit, setProfit] = useState(0);

  const startGame = () => {
    if (!currentUser) return;
    if (currentUser.balance < bet) return;
    casinoStore.updateBalance(currentUser.id, -bet, 'loss', `Минёр: ставка ${bet} К`);
    setGrid(generateGrid(mines));
    setGameState('playing');
    setSafeCount(0);
    setCurrentMultiplier(1);
    setProfit(0);
  };

  const revealCell = (idx: number) => {
    if (gameState !== 'playing') return;
    const cell = grid[idx];
    if (cell.isRevealed) return;

    const newGrid = grid.map((c, i) => i === idx ? { ...c, isRevealed: true } : c);

    if (cell.isMine) {
      const fullGrid = newGrid.map(c => ({ ...c, isRevealed: true }));
      setGrid(fullGrid);
      setGameState('lost');
      setProfit(-bet);
    } else {
      setGrid(newGrid);
      const newSafe = safeCount + 1;
      setSafeCount(newSafe);
      const mults = MULTIPLIERS[mines] || MULTIPLIERS[5];
      const mult = mults[Math.min(newSafe - 1, mults.length - 1)] || mults[mults.length - 1];
      setCurrentMultiplier(mult);
      setProfit(Math.floor(bet * mult) - bet);
    }
  };

  const cashOut = () => {
    if (gameState !== 'playing' || safeCount === 0) return;
    const winAmount = Math.floor(bet * currentMultiplier);
    casinoStore.updateBalance(currentUser!.id, winAmount, 'win', `Минёр: выигрыш ${winAmount} К (x${currentMultiplier.toFixed(2)})`);
    setProfit(winAmount - bet);
    setGrid(grid.map(c => ({ ...c, isRevealed: c.isRevealed || c.isMine })));
    setGameState('won');
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <span className="text-xl">💣</span>
        </div>
        <div>
          <h2 className="font-oswald text-lg gold-text tracking-wide">МИНЁР</h2>
          <p className="text-xs text-muted-foreground">Открывай клетки, избегай мин</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* Controls */}
        <div className="card-dark p-4 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Ставка (К)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={bet}
                onChange={e => setBet(Math.max(10, parseInt(e.target.value) || 10))}
                disabled={gameState === 'playing'}
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 disabled:opacity-50"
              />
            </div>
            <div className="grid grid-cols-4 gap-1 mt-2">
              {[50, 100, 500, 1000].map(v => (
                <button
                  key={v}
                  onClick={() => setBet(v)}
                  disabled={gameState === 'playing'}
                  className="text-xs py-1.5 bg-muted rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Количество мин</label>
            <div className="grid grid-cols-3 gap-1.5">
              {MINE_COUNTS.map(m => (
                <button
                  key={m}
                  onClick={() => setMines(m)}
                  disabled={gameState === 'playing'}
                  className={`py-2 text-sm rounded-lg transition-colors disabled:opacity-50 ${mines === m ? 'btn-gold' : 'bg-muted hover:bg-secondary'}`}
                >
                  {m} 💣
                </button>
              ))}
            </div>
          </div>

          {gameState === 'playing' && safeCount > 0 && (
            <div className="card-dark p-3 rounded-xl border border-amber-500/20 text-center">
              <p className="text-xs text-muted-foreground">Текущий выигрыш</p>
              <p className="text-xl font-oswald gold-text">{Math.floor(bet * currentMultiplier)} К</p>
              <p className="text-xs text-green-400">x{currentMultiplier.toFixed(2)}</p>
            </div>
          )}

          {(gameState === 'won' || gameState === 'lost') && (
            <div className={`p-3 rounded-xl text-center ${gameState === 'won' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              <p className={`text-lg font-oswald ${gameState === 'won' ? 'text-green-400' : 'text-red-400'}`}>
                {gameState === 'won' ? `+${profit} К` : `-${bet} К`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {gameState === 'won' ? 'Вы выиграли!' : 'Вы попали на мину'}
              </p>
            </div>
          )}

          {!currentUser && (
            <p className="text-xs text-muted-foreground text-center">Войдите чтобы играть</p>
          )}

          {gameState === 'idle' || gameState === 'won' || gameState === 'lost' ? (
            <button
              onClick={startGame}
              disabled={!currentUser || (currentUser?.balance ?? 0) < bet}
              className="btn-gold w-full py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {gameState === 'idle' ? 'Начать игру' : 'Играть снова'}
            </button>
          ) : (
            <button
              onClick={cashOut}
              disabled={safeCount === 0}
              className="w-full py-2.5 text-sm font-semibold rounded-lg bg-green-500 hover:bg-green-400 text-black transition-colors disabled:opacity-40"
            >
              Забрать {Math.floor(bet * currentMultiplier)} К
            </button>
          )}
        </div>

        {/* Grid */}
        <div className="card-dark p-4">
          {grid.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground text-sm">
              Нажмите «Начать игру»
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-1.5">
              {grid.map((cell, idx) => (
                <button
                  key={idx}
                  onClick={() => revealCell(idx)}
                  disabled={cell.isRevealed || gameState !== 'playing'}
                  className={`
                    aspect-square rounded-lg text-lg font-bold transition-all
                    ${!cell.isRevealed && gameState === 'playing' ? 'bg-muted hover:bg-amber-500/20 hover:border-amber-500/40 border border-border hover:scale-105 active:scale-95' : ''}
                    ${cell.isRevealed && cell.isMine ? 'bg-red-500/20 border border-red-500/40' : ''}
                    ${cell.isRevealed && !cell.isMine ? 'bg-green-500/20 border border-green-500/40' : ''}
                    ${!cell.isRevealed && gameState !== 'playing' ? 'bg-muted border border-border opacity-50' : ''}
                  `}
                >
                  {cell.isRevealed ? (cell.isMine ? '💣' : '💎') : ''}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
