import { useState, useRef } from 'react';
import { casinoStore, useCasino } from '@/store/casinoStore';

const SYMBOLS = ['🍋', '🍊', '🍇', '🔔', '⭐', '💎', '7️⃣', '🎰'];
const PAYOUTS: Record<string, number> = {
  '7️⃣': 50, '💎': 25, '⭐': 15, '🔔': 10, '🍇': 7, '🍊': 5, '🍋': 3, '🎰': 20,
};
const REEL_COUNT = 3;

function getRandomSymbol(): string {
  const weights = [30, 25, 20, 15, 12, 8, 5, 3];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SYMBOLS.length; i++) {
    r -= weights[i];
    if (r <= 0) return SYMBOLS[i];
  }
  return SYMBOLS[0];
}

function spinReel(): string[] {
  return [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
}

export default function SlotClassic() {
  const { currentUser } = useCasino();
  const [bet, setBet] = useState(50);
  const [reels, setReels] = useState<string[][]>([['🍋', '🍊', '🍇'], ['🔔', '⭐', '💎'], ['7️⃣', '🎰', '🍋']]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ win: number; message: string } | null>(null);
  const [activeRow, setActiveRow] = useState<number[]>([]);
  const spinRef = useRef(false);

  const spin = async () => {
    if (!currentUser || spinning || currentUser.balance < bet) return;
    setSpinning(true);
    spinRef.current = true;
    setResult(null);
    setActiveRow([]);
    casinoStore.updateBalance(currentUser.id, -bet, 'loss', `Слот Классик: ставка ${bet} К`);

    const intervals: NodeJS.Timeout[] = [];
    const finalReels: string[][] = [];

    for (let r = 0; r < REEL_COUNT; r++) {
      finalReels.push(spinReel());
    }

    // Animate spinning
    for (let r = 0; r < REEL_COUNT; r++) {
      const rIdx = r;
      let ticks = 0;
      const maxTicks = 8 + rIdx * 4;
      const iv = setInterval(() => {
        ticks++;
        setReels(prev => {
          const next = [...prev];
          next[rIdx] = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
          return next;
        });
        if (ticks >= maxTicks) {
          clearInterval(iv);
          setReels(prev => {
            const next = [...prev];
            next[rIdx] = finalReels[rIdx];
            return next;
          });
          if (rIdx === REEL_COUNT - 1) {
            // Check win
            setTimeout(() => {
              const wins: { row: number; symbols: string; mult: number }[] = [];
              for (let row = 0; row < 3; row++) {
                const rowSymbols = finalReels.map(reel => reel[row]);
                if (rowSymbols[0] === rowSymbols[1] && rowSymbols[1] === rowSymbols[2]) {
                  wins.push({ row, symbols: rowSymbols[0], mult: PAYOUTS[rowSymbols[0]] || 3 });
                }
              }
              if (wins.length > 0) {
                const totalMult = wins.reduce((s, w) => s + w.mult, 0);
                const winAmount = Math.floor(bet * totalMult);
                casinoStore.updateBalance(currentUser.id, winAmount, 'win', `Слот Классик: выигрыш ${winAmount} К`);
                setResult({ win: winAmount, message: `${wins.map(w => w.symbols + w.symbols + w.symbols).join(' + ')} x${totalMult}` });
                setActiveRow(wins.map(w => w.row));
              } else {
                setResult({ win: 0, message: 'Не повезло...' });
              }
              setSpinning(false);
            }, 200);
          }
        }
      }, 80);
      intervals.push(iv);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <span className="text-xl">🎰</span>
        </div>
        <div>
          <h2 className="font-oswald text-lg gold-text tracking-wide">СЛОТ КЛАССИК</h2>
          <p className="text-xs text-muted-foreground">Три одинаковых символа в ряд</p>
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
            <p className="text-xs text-muted-foreground mb-2">Таблица выплат</p>
            {Object.entries(PAYOUTS).slice(0, 5).map(([sym, mult]) => (
              <div key={sym} className="flex items-center justify-between text-xs">
                <span>{sym}{sym}{sym}</span>
                <span className="gold-text font-medium">x{mult}</span>
              </div>
            ))}
          </div>

          {result && (
            <div className={`p-3 rounded-xl text-center ${result.win > 0 ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted border border-border'}`}>
              <p className={`font-oswald text-lg ${result.win > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
                {result.win > 0 ? `+${result.win} К` : result.message}
              </p>
              {result.win > 0 && <p className="text-xs text-muted-foreground mt-1">{result.message}</p>}
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

        {/* Slot machine */}
        <div className="card-dark p-6 flex items-center justify-center">
          <div className="w-full max-w-sm">
            {/* Machine frame */}
            <div className="bg-muted border-2 border-border rounded-2xl p-4 shadow-2xl">
              <div className="grid grid-cols-3 gap-2">
                {reels.map((reel, rIdx) => (
                  <div key={rIdx} className="flex flex-col gap-1">
                    {reel.map((sym, rowIdx) => (
                      <div
                        key={rowIdx}
                        className={`
                          aspect-square flex items-center justify-center text-3xl rounded-xl border transition-all
                          ${activeRow.includes(rowIdx) ? 'bg-amber-500/20 border-amber-500/60 animate-pulse-gold' : 'bg-card border-border'}
                          ${spinning ? 'blur-[1px]' : ''}
                        `}
                      >
                        {sym}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              {/* Middle line indicator */}
              <div className="mt-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-amber-500/40" />
                <span className="text-xs text-amber-500/60">WIN LINE</span>
                <div className="h-px flex-1 bg-amber-500/40" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
