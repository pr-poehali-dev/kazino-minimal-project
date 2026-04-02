import { useState, useEffect, useRef } from 'react';
import { casinoStore, useCasino } from '@/store/casinoStore';

export default function Crash() {
  const { currentUser } = useCasino();
  const [bet, setBet] = useState(100);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [gameState, setGameState] = useState<'idle' | 'betting' | 'flying' | 'crashed'>('idle');
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(0);
  const [hasBet, setHasBet] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [cashedMultiplier, setCashedMultiplier] = useState(0);
  const [history, setHistory] = useState<number[]>([3.21, 1.05, 7.84, 2.34, 1.12, 15.6, 1.01, 4.55, 2.01, 9.8]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(0);
  const betRef = useRef(bet);
  betRef.current = bet;

  const generateCrashPoint = () => {
    const r = Math.random();
    if (r < 0.33) return 1.0 + Math.random() * 0.5;
    if (r < 0.6) return 1.5 + Math.random() * 1.5;
    if (r < 0.8) return 3.0 + Math.random() * 5;
    if (r < 0.95) return 8.0 + Math.random() * 20;
    return 28.0 + Math.random() * 70;
  };

  const startRound = () => {
    const cp = generateCrashPoint();
    setCrashPoint(cp);
    setGameState('betting');
    setMultiplier(1.0);
    setCashedOut(false);
    setCashedMultiplier(0);

    setTimeout(() => {
      setGameState('flying');
      startTimeRef.current = Date.now();

      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const newMult = Math.max(1.0, 1.0 + elapsed * 0.5 + Math.pow(elapsed, 2) * 0.1);

        setMultiplier(prev => {
          if (newMult >= cp) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setGameState('crashed');
            setHistory(h => [parseFloat(cp.toFixed(2)), ...h.slice(0, 9)]);
            return parseFloat(cp.toFixed(2));
          }
          return parseFloat(newMult.toFixed(2));
        });
      }, 80);
    }, 2000);
  };

  useEffect(() => {
    if (gameState === 'flying') {
      const checkAutoOut = setInterval(() => {
        setMultiplier(m => {
          if (m >= autoCashout && hasBet && !cashedOut) {
            doCashout(m);
          }
          return m;
        });
      }, 100);
      return () => clearInterval(checkAutoOut);
    }
  }, [gameState, autoCashout, hasBet, cashedOut]);

  useEffect(() => {
    if (gameState === 'crashed') {
      const t = setTimeout(() => {
        setHasBet(false);
        startRound();
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [gameState]);

  useEffect(() => {
    startRound();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const placeBet = () => {
    if (!currentUser || hasBet || gameState !== 'betting') return;
    if (currentUser.balance < bet) return;
    casinoStore.updateBalance(currentUser.id, -bet, 'loss', `Краш: ставка ${bet} К`);
    setHasBet(true);
  };

  const doCashout = (m?: number) => {
    const finalMult = m || multiplier;
    if (!hasBet || cashedOut || gameState !== 'flying') return;
    const win = Math.floor(betRef.current * finalMult);
    casinoStore.updateBalance(currentUser!.id, win, 'win', `Краш: выигрыш ${win} К (x${finalMult.toFixed(2)})`);
    setCashedOut(true);
    setCashedMultiplier(finalMult);
  };

  const getColor = () => {
    if (gameState === 'crashed') return 'text-red-400';
    if (multiplier >= 5) return 'text-purple-400';
    if (multiplier >= 2) return 'text-green-400';
    return 'gold-text';
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <span className="text-xl">🚀</span>
        </div>
        <div>
          <h2 className="font-oswald text-lg gold-text tracking-wide">КРАШ</h2>
          <p className="text-xs text-muted-foreground">Успей забрать до краша</p>
        </div>
      </div>

      {/* History */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {history.map((h, i) => (
          <span key={i} className={`text-xs px-2 py-1 rounded-md font-medium ${h >= 2 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {h.toFixed(2)}x
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* Controls */}
        <div className="card-dark p-4 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Ставка (К)</label>
            <input
              type="number"
              value={bet}
              onChange={e => setBet(Math.max(10, parseInt(e.target.value) || 10))}
              disabled={hasBet || gameState === 'flying'}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 disabled:opacity-50"
            />
            <div className="grid grid-cols-4 gap-1 mt-2">
              {[50, 100, 500, 1000].map(v => (
                <button key={v} onClick={() => setBet(v)} disabled={hasBet} className="text-xs py-1.5 bg-muted rounded-md hover:bg-secondary disabled:opacity-50 transition-colors">
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Авто-забрать при x</label>
            <input
              type="number"
              step="0.1"
              min="1.1"
              value={autoCashout}
              onChange={e => setAutoCashout(parseFloat(e.target.value) || 2)}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          {cashedOut && (
            <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl text-center">
              <p className="text-green-400 font-oswald text-lg">+{Math.floor(bet * cashedMultiplier)} К</p>
              <p className="text-xs text-muted-foreground">Забрано при x{cashedMultiplier.toFixed(2)}</p>
            </div>
          )}

          {!currentUser && <p className="text-xs text-muted-foreground text-center">Войдите чтобы играть</p>}

          {gameState === 'betting' && !hasBet ? (
            <button onClick={placeBet} disabled={!currentUser} className="btn-gold w-full py-2.5 text-sm disabled:opacity-40">
              Поставить {bet} К
            </button>
          ) : gameState === 'flying' && hasBet && !cashedOut ? (
            <button onClick={() => doCashout()} className="w-full py-2.5 text-sm font-semibold rounded-lg bg-green-500 hover:bg-green-400 text-black transition-colors animate-pulse-gold">
              Забрать {Math.floor(bet * multiplier)} К
            </button>
          ) : (
            <div className="w-full py-2.5 text-sm text-center text-muted-foreground bg-muted rounded-lg">
              {gameState === 'betting' && hasBet ? '⏳ Ждём старта...' : gameState === 'flying' ? '✈️ Летим...' : ''}
            </div>
          )}
        </div>

        {/* Crash display */}
        <div className="card-dark p-4 flex items-center justify-center min-h-[300px] relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="absolute border-b border-foreground w-full" style={{ bottom: `${i * 10}%` }} />
            ))}
          </div>
          <div className="text-center z-10">
            {gameState === 'betting' && (
              <div>
                <p className="text-muted-foreground text-sm mb-2">Следующий раунд через...</p>
                <div className="text-6xl font-oswald gold-text animate-pulse">СТАВКИ</div>
              </div>
            )}
            {(gameState === 'flying' || gameState === 'crashed') && (
              <div>
                <div className={`text-7xl md:text-8xl font-oswald tracking-wider ${getColor()} transition-colors`}>
                  {multiplier.toFixed(2)}x
                </div>
                {gameState === 'crashed' && (
                  <p className="text-red-400 mt-3 text-lg font-medium">💥 КРАШ!</p>
                )}
                {gameState === 'flying' && (
                  <div className="mt-4 text-4xl" style={{ animation: 'crash-fly 2s ease-in-out infinite alternate' }}>🚀</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
