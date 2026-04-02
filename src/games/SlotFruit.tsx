import { useState } from 'react';
import { casinoStore, useCasino } from '@/store/casinoStore';

const ROWS = 3;
const COLS = 5;

const SYMBOLS = [
  { s: '🍒', w: 35, pay: [0, 0, 2, 4, 8] },
  { s: '🍋', w: 28, pay: [0, 0, 3, 6, 12] },
  { s: '🍊', w: 22, pay: [0, 0, 5, 10, 20] },
  { s: '🍉', w: 18, pay: [0, 0, 8, 15, 30] },
  { s: '🍇', w: 14, pay: [0, 0, 12, 25, 50] },
  { s: '⭐', w: 10, pay: [0, 0, 20, 40, 80] },
  { s: '💎', w: 6, pay: [0, 0, 35, 70, 150] },
  { s: '👑', w: 3, pay: [0, 2, 60, 150, 400] },
];

function weightedRandom(): typeof SYMBOLS[0] {
  const total = SYMBOLS.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * total;
  for (const sym of SYMBOLS) {
    r -= sym.w;
    if (r <= 0) return sym;
  }
  return SYMBOLS[0];
}

function generateGrid(): string[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => weightedRandom().s)
  );
}

function calculateWin(grid: string[][], bet: number): { total: number; lines: { row: number; count: number; symbol: string; win: number }[] } {
  const lines: { row: number; count: number; symbol: string; win: number }[] = [];
  let total = 0;

  for (let row = 0; row < ROWS; row++) {
    const rowSyms = grid[row];
    const first = rowSyms[0];
    let count = 1;
    for (let c = 1; c < COLS; c++) {
      if (rowSyms[c] === first) count++;
      else break;
    }
    if (count >= 2) {
      const sym = SYMBOLS.find(s => s.s === first);
      const mult = sym?.pay[count] || 0;
      if (mult > 0) {
        const win = Math.floor(bet * mult / ROWS);
        total += win;
        lines.push({ row, count, symbol: first, win });
      }
    }
  }
  return { total, lines };
}

export default function SlotFruit() {
  const { currentUser } = useCasino();
  const [bet, setBet] = useState(50);
  const [grid, setGrid] = useState<string[][]>(generateGrid);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof calculateWin> | null>(null);
  const [winLines, setWinLines] = useState<number[]>([]);

  const spin = async () => {
    if (!currentUser || spinning || currentUser.balance < bet) return;
    setSpinning(true);
    setResult(null);
    setWinLines([]);
    casinoStore.updateBalance(currentUser.id, -bet, 'loss', `Слот Фрукты: ставка ${bet} К`);

    const STEPS = 12;
    let step = 0;
    const finalGrid = generateGrid();

    const iv = setInterval(() => {
      step++;
      if (step < STEPS) {
        setGrid(generateGrid());
      } else {
        clearInterval(iv);
        setGrid(finalGrid);
        const res = calculateWin(finalGrid, bet);
        setResult(res);
        setWinLines(res.lines.map(l => l.row));
        if (res.total > 0) {
          casinoStore.updateBalance(currentUser.id, res.total, 'win', `Слот Фрукты: выигрыш ${res.total} К`);
        }
        setSpinning(false);
      }
    }, 80);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <span className="text-xl">🍒</span>
        </div>
        <div>
          <h2 className="font-oswald text-lg gold-text tracking-wide">СЛОТ ФРУКТЫ</h2>
          <p className="text-xs text-muted-foreground">5 барабанов · 3 линии выплат</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <div className="card-dark p-4 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Ставка (К)</label>
            <input
              type="number"
              value={bet}
              onChange={e => setBet(Math.max(10, parseInt(e.target.value) || 10))}
              disabled={spinning}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 disabled:opacity-50"
            />
            <div className="grid grid-cols-4 gap-1 mt-2">
              {[25, 50, 200, 500].map(v => (
                <button key={v} onClick={() => setBet(v)} disabled={spinning} className="text-xs py-1.5 bg-muted rounded-md hover:bg-secondary disabled:opacity-50 transition-colors">
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="card-dark p-3 rounded-xl space-y-1">
            <p className="text-xs text-muted-foreground mb-2">Топ выплаты (5 в ряд)</p>
            {SYMBOLS.slice().reverse().slice(0, 5).map(sym => (
              <div key={sym.s} className="flex items-center justify-between text-xs">
                <span>{sym.s} × 5</span>
                <span className="gold-text font-medium">x{sym.pay[4]}</span>
              </div>
            ))}
          </div>

          {result && (
            <div className={`p-3 rounded-xl text-center ${result.total > 0 ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted border border-border'}`}>
              <p className={`font-oswald text-lg ${result.total > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
                {result.total > 0 ? `+${result.total} К` : 'Не повезло...'}
              </p>
              {result.lines.map((l, i) => (
                <p key={i} className="text-xs text-muted-foreground mt-0.5">
                  Линия {l.row + 1}: {l.symbol} × {l.count} = +{l.win} К
                </p>
              ))}
            </div>
          )}

          {!currentUser && <p className="text-xs text-muted-foreground text-center">Войдите чтобы играть</p>}

          <button
            onClick={spin}
            disabled={spinning || !currentUser || (currentUser?.balance ?? 0) < bet}
            className="btn-gold w-full py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {spinning ? '⏳ Крутим...' : 'КРУТИТЬ'}
          </button>
        </div>

        {/* Slot display */}
        <div className="card-dark p-6 flex items-center justify-center">
          <div className="w-full">
            <div className="bg-muted border-2 border-border rounded-2xl p-4">
              {grid.map((row, rIdx) => (
                <div
                  key={rIdx}
                  className={`flex gap-2 mb-2 last:mb-0 p-1 rounded-xl transition-all ${winLines.includes(rIdx) ? 'bg-amber-500/10 border border-amber-500/30' : ''}`}
                >
                  {/* Line indicator */}
                  <div className={`flex items-center justify-center w-5 text-xs font-bold rounded ${winLines.includes(rIdx) ? 'text-amber-500' : 'text-muted-foreground'}`}>
                    {rIdx + 1}
                  </div>
                  {row.map((sym, cIdx) => (
                    <div
                      key={cIdx}
                      className={`
                        flex-1 aspect-square flex items-center justify-center text-2xl md:text-3xl rounded-xl border transition-all
                        ${winLines.includes(rIdx) ? 'bg-amber-500/20 border-amber-500/40 animate-pulse-gold' : 'bg-card border-border'}
                        ${spinning ? 'blur-[1px]' : ''}
                      `}
                    >
                      {sym}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
