import { useState, useRef } from 'react';
import { casinoStore, useCasino } from '@/store/casinoStore';

// Each reel has random height 2–7 symbols (Megaways)
const REEL_COUNT = 6;
const MIN_HEIGHT = 2;
const MAX_HEIGHT = 7;

const SYMS = [
  { id: 'gem',    emoji: '💎', w: 3,  pay3: 50, pay4: 100, pay5: 300, pay6: 800  },
  { id: 'star',   emoji: '⭐', w: 6,  pay3: 25, pay4: 60,  pay5: 150, pay6: 400  },
  { id: 'bell',   emoji: '🔔', w: 8,  pay3: 15, pay4: 35,  pay5: 80,  pay6: 200  },
  { id: 'lucky',  emoji: '🍀', w: 10, pay3: 8,  pay4: 20,  pay5: 50,  pay6: 120  },
  { id: 'coin',   emoji: '🪙', w: 14, pay3: 5,  pay4: 12,  pay5: 30,  pay6: 70   },
  { id: 'crystal',emoji: '🔷', w: 16, pay3: 3,  pay4: 8,   pay5: 20,  pay6: 50   },
  { id: 'wild',   emoji: '🌟', w: 5,  pay3: 30, pay4: 80,  pay5: 200, pay6: 500, isWild: true },
  { id: 'scatter',emoji: '🎯', w: 4,  pay3: 0,  pay4: 0,   pay5: 0,   pay6: 0,   isScatter: true },
];

type Sym = typeof SYMS[0];
type Reel = Sym[];

const TOTAL_W = SYMS.reduce((s, x) => s + x.w, 0);

function randSym(forBonus = false): Sym {
  const pool = forBonus ? [...SYMS, SYMS[6], SYMS[6]] : SYMS;
  const total = pool.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * total;
  for (const s of pool) { r -= s.w; if (r <= 0) return s; }
  return SYMS[SYMS.length - 2];
}

function makeReels(forBonus = false): Reel[] {
  return Array.from({ length: REEL_COUNT }, () => {
    const h = MIN_HEIGHT + Math.floor(Math.random() * (MAX_HEIGHT - MIN_HEIGHT + 1));
    return Array.from({ length: h }, () => randSym(forBonus));
  });
}

// Count any same-symbol combos left-to-right across reels (Megaways style: at least 1 per reel)
function calcMegawaysWins(reels: Reel[], bet: number): { wins: { sym: string; count: number; mult: number; win: number }[]; total: number; scatters: number } {
  const wins: { sym: string; count: number; mult: number; win: number }[] = [];
  let total = 0;

  // Count scatters
  let scatters = 0;
  for (const reel of reels)
    for (const s of reel)
      if (s.isScatter) scatters++;

  // For each non-special symbol, check how many consecutive reels contain it (or wild)
  const checked = new Set<string>();
  for (const reel of reels) {
    for (const startSym of reel) {
      if (startSym.isScatter || startSym.isWild || checked.has(startSym.id)) continue;
      checked.add(startSym.id);

      let count = 0;
      for (const r of reels) {
        const hasIt = r.some(s => s.id === startSym.id || s.isWild);
        if (hasIt) count++;
        else break;
      }

      if (count >= 3) {
        const payKey = `pay${Math.min(count, 6)}` as keyof Sym;
        const mult = (startSym[payKey] as number) || 0;
        if (mult > 0) {
          const win = Math.floor(bet * mult / 100);
          total += win;
          wins.push({ sym: startSym.emoji, count, mult, win });
        }
      }
    }
  }

  return { wins, total, scatters };
}

const BET_LEVELS = [10, 25, 50, 100, 200, 500, 1000];
const BONUS_COST_MULT = 80;
const FREE_SPINS_COUNT = 12;

export default function SlotMegaways() {
  const { currentUser } = useCasino();
  const [betLevel, setBetLevel] = useState(2);
  const [reels, setReels] = useState<Reel[]>(makeReels);
  const [spinning, setSpinning] = useState(false);
  const [winData, setWinData] = useState<ReturnType<typeof calcMegawaysWins> | null>(null);

  // Cascade (tumble) state
  const [cascadeCount, setCascadeCount] = useState(0);
  const [cascadeMult, setCascadeMult] = useState(1);
  const [cascadeMsg, setCascadeMsg] = useState('');

  // Bonus
  const [bonusMode, setBonusMode] = useState(false);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [freeSpinsTotal, setFreeSpinsTotal] = useState(0);
  const [bonusWinTotal, setBonusWinTotal] = useState(0);
  const [bonusMult, setBonusMult] = useState(1);
  const [showBonusBanner, setShowBonusBanner] = useState(false);
  const [bonusEndMsg, setBonusEndMsg] = useState('');
  const [winCells, setWinCells] = useState<Set<string>>(new Set());

  const spinning$ = useRef(false);
  const bet = BET_LEVELS[betLevel];

  const doSpin = (isBonus = false, fsLeft = freeSpinsLeft, bonMulti = bonusMult) => {
    if (spinning$.current) return;
    spinning$.current = true;
    setSpinning(true);
    setWinData(null);
    setWinCells(new Set());
    setCascadeMsg('');

    if (!isBonus) {
      casinoStore.updateBalance(currentUser!.id, -bet, 'loss', `Слот Megaways: ставка ${bet} К`);
    }

    const STEPS = 12;
    let step = 0;
    const finalReels = makeReels(isBonus);

    const iv = setInterval(() => {
      step++;
      if (step < STEPS) {
        setReels(makeReels(isBonus));
      } else {
        clearInterval(iv);
        setReels(finalReels);
        spinning$.current = false;
        setSpinning(false);

        const result = calcMegawaysWins(finalReels, bet);
        setWinData(result);

        // Highlight cells
        const cells = new Set<string>();
        result.wins.forEach(w => {
          // mark all reels up to count
          for (let ri = 0; ri < w.count; ri++) {
            finalReels[ri].forEach((_, si) => cells.add(`${ri}-${si}`));
          }
        });
        setWinCells(cells);

        const mult = isBonus ? bonMulti : 1;
        const actualWin = Math.floor(result.total * mult);

        if (actualWin > 0) {
          casinoStore.updateBalance(currentUser!.id, actualWin, 'win',
            `Слот Megaways: ${isBonus ? 'фриспин' : 'выигрыш'} ${actualWin} К`);
          if (isBonus) setBonusWinTotal(p => p + actualWin);
        }

        // Cascade: if win, do cascade after delay
        if (result.total > 0 && !isBonus) {
          const newCasc = cascadeCount + 1;
          setCascadeCount(newCasc);
          const newMult = Math.min(newCasc, 5);
          setCascadeMult(newMult);
          setCascadeMsg(`🔥 Каскад ×${newMult}!`);
          setTimeout(() => {
            setCascadeMsg('');
            setCascadeCount(0);
            setCascadeMult(1);
          }, 1500);
        } else {
          setCascadeCount(0);
          setCascadeMult(1);
        }

        // Handle bonus scatter trigger
        if (!isBonus && result.scatters >= 3) {
          const spins = result.scatters === 3 ? FREE_SPINS_COUNT : result.scatters >= 5 ? FREE_SPINS_COUNT * 2 : FREE_SPINS_COUNT + 6;
          setFreeSpinsLeft(spins);
          setFreeSpinsTotal(spins);
          setBonusWinTotal(0);
          setBonusMult(1);
          setShowBonusBanner(true);
          setTimeout(() => {
            setShowBonusBanner(false);
            setBonusMode(true);
            doSpin(true, spins, 1);
          }, 2500);
          return;
        }

        // Continue bonus
        if (isBonus) {
          const remaining = fsLeft - 1;
          setFreeSpinsLeft(remaining);
          // Each win in bonus increases multiplier
          const newBonMult = result.total > 0 ? Math.min(bonMulti + 1, 15) : bonMulti;
          setBonusMult(newBonMult);

          if (remaining > 0) {
            setTimeout(() => doSpin(true, remaining, newBonMult), 1300);
          } else {
            setBonusMode(false);
            setBonusEndMsg(`Бонус окончен! Выиграно: ${bonusWinTotal + actualWin} К`);
            setTimeout(() => setBonusEndMsg(''), 5000);
          }
        }
      }
    }, 70);
  };

  const handleSpin = () => {
    if (!currentUser || spinning || bonusMode || currentUser.balance < bet) return;
    doSpin(false);
  };

  const buyBonus = () => {
    const cost = bet * BONUS_COST_MULT;
    if (!currentUser || currentUser.balance < cost || spinning || bonusMode) return;
    casinoStore.updateBalance(currentUser.id, -cost, 'loss', `Megaways: покупка бонуса ${cost} К`);
    setFreeSpinsLeft(FREE_SPINS_COUNT);
    setFreeSpinsTotal(FREE_SPINS_COUNT);
    setBonusWinTotal(0);
    setBonusMult(1);
    setShowBonusBanner(true);
    setTimeout(() => {
      setShowBonusBanner(false);
      setBonusMode(true);
      doSpin(true, FREE_SPINS_COUNT, 1);
    }, 2500);
  };

  const bonusCost = bet * BONUS_COST_MULT;
  const maxReelHeight = Math.max(...reels.map(r => r.length));

  return (
    <div className="animate-fade-in relative">
      {/* Bonus banner */}
      {showBonusBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="text-center animate-scale-in">
            <div className="text-7xl mb-4">🌟</div>
            <p className="font-oswald text-4xl gold-text tracking-widest mb-2">MEGAWAYS БОНУС!</p>
            <p className="text-muted-foreground text-lg">{freeSpinsTotal} фриспинов с нарастающим ×</p>
            <p className="text-sm text-muted-foreground mt-2">Каждая победа увеличивает множитель!</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <span className="text-xl">🌟</span>
        </div>
        <div>
          <h2 className="font-oswald text-lg gold-text tracking-wide">MEGAWAYS BLAST</h2>
          <p className="text-xs text-muted-foreground">6 барабанов · Случайные высоты · Каскады · Нарастающий ×</p>
        </div>
        {bonusMode && (
          <div className="ml-auto flex items-center gap-3">
            <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl animate-pulse-gold">
              <span className="text-sm font-oswald gold-text">FS: {freeSpinsLeft}</span>
            </div>
            <div className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <span className="text-sm font-oswald text-purple-400">×{bonusMult}</span>
            </div>
          </div>
        )}
      </div>

      {cascadeMsg && (
        <div className="mb-3 text-center animate-scale-in">
          <span className="px-4 py-2 bg-orange-500/20 border border-orange-500/40 rounded-xl text-orange-400 font-oswald text-lg tracking-wide">
            {cascadeMsg}
          </span>
        </div>
      )}

      {bonusEndMsg && (
        <div className="mb-4 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm font-medium animate-fade-in">
          🎉 {bonusEndMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-4">
        {/* Controls */}
        <div className="space-y-3">
          <div className="card-dark p-4 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-muted-foreground">Ставка</label>
                <span className="text-xs font-semibold gold-text">{bet} К</span>
              </div>
              <input
                type="range"
                min={0}
                max={BET_LEVELS.length - 1}
                value={betLevel}
                onChange={e => setBetLevel(+e.target.value)}
                disabled={spinning || bonusMode}
                className="w-full accent-amber-500 disabled:opacity-50"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                {BET_LEVELS.map((v, i) => (
                  <span key={i} className={i === betLevel ? 'gold-text font-bold' : ''}>{v}</span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs border-t border-border pt-2">
              <span className="text-muted-foreground">Текущий каскад</span>
              <span className={`font-oswald ${cascadeMult > 1 ? 'text-orange-400' : 'text-muted-foreground'}`}>×{cascadeMult}</span>
            </div>
          </div>

          {/* Win info */}
          {winData && (
            <div className={`card-dark p-4 animate-scale-in ${winData.total > 0 ? 'border-green-500/20' : ''}`}>
              {winData.total > 0 ? (
                <>
                  <p className="text-green-400 font-oswald text-xl text-center">
                    +{Math.floor(winData.total * (bonusMode ? bonusMult : cascadeMult))} К
                  </p>
                  {winData.wins.slice(0, 4).map((w, i) => (
                    <p key={i} className="text-xs text-muted-foreground text-center mt-1">
                      {w.sym} × {w.count} рил → x{w.mult}
                    </p>
                  ))}
                  {bonusMode && bonusMult > 1 && (
                    <p className="text-xs text-purple-400 text-center mt-1">Бонус-множитель: ×{bonusMult}</p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-sm text-center">Не повезло...</p>
              )}
            </div>
          )}

          {bonusMode && (
            <div className="card-dark p-4 border border-amber-500/20">
              <p className="text-xs text-muted-foreground text-center">Выиграно в бонусе</p>
              <p className="font-oswald text-2xl gold-text text-center">{bonusWinTotal} К</p>
              <div className="flex justify-center gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded">×{bonusMult} мульт</span>
              </div>
            </div>
          )}

          {/* Paytable */}
          <div className="card-dark p-3">
            <p className="text-xs text-muted-foreground mb-2">Выплаты (% от ставки)</p>
            <div className="space-y-1">
              {SYMS.filter(s => !s.isScatter).slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <span>{s.emoji}</span>
                  <div className="flex gap-2 text-muted-foreground">
                    <span>3→<span className="gold-text">{s.pay3}%</span></span>
                    <span>5→<span className="gold-text">{s.pay5}%</span></span>
                    <span>6→<span className="gold-text">{s.pay6}%</span></span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">🌟 Wild · 🎯 Scatter (3+ = фриспины)</p>
          </div>

          {!currentUser && <p className="text-xs text-muted-foreground text-center">Войдите чтобы играть</p>}

          <button
            onClick={handleSpin}
            disabled={spinning || bonusMode || !currentUser || (currentUser?.balance ?? 0) < bet}
            className="btn-gold w-full py-3 text-sm font-oswald tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {spinning ? '⏳ КРУТИМ...' : bonusMode ? `ФРИСПИН ${freeSpinsLeft}` : 'КРУТИТЬ'}
          </button>

          <button
            onClick={buyBonus}
            disabled={spinning || bonusMode || !currentUser || (currentUser?.balance ?? 0) < bonusCost}
            className="btn-ghost-gold w-full py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="flex items-center justify-center gap-2">
              <span>⚡</span>
              Купить бонус — {bonusCost.toLocaleString()} К
            </span>
          </button>
          <p className="text-xs text-muted-foreground text-center -mt-1">{FREE_SPINS_COUNT} фриспинов с нарастающим ×</p>
        </div>

        {/* Megaways Grid */}
        <div className={`card-dark p-4 transition-all ${bonusMode ? 'border-purple-500/20 bg-purple-500/5' : ''}`}>
          {bonusMode && (
            <div className="text-center mb-3">
              <span className="text-xs font-medium text-purple-400">
                ✨ MEGAWAYS БОНУС — {freeSpinsLeft} фриспинов · ×{bonusMult}
              </span>
            </div>
          )}

          {/* Ways counter */}
          <div className="text-center mb-2">
            <span className="text-xs text-muted-foreground">
              {reels.reduce((prod, r) => prod * r.length, 1).toLocaleString()} WAYS
            </span>
          </div>

          <div className="flex gap-1.5 justify-center" style={{ minHeight: `${maxReelHeight * 52}px` }}>
            {reels.map((reel, ri) => (
              <div
                key={ri}
                className="flex flex-col gap-1.5 justify-end flex-1"
                style={{ maxWidth: '80px' }}
              >
                {reel.map((sym, si) => {
                  const isWin = winCells.has(`${ri}-${si}`);
                  return (
                    <div
                      key={si}
                      className={`
                        flex items-center justify-center rounded-xl border text-xl transition-all
                        ${isWin ? 'bg-green-500/20 border-green-500/50 scale-105' : ''}
                        ${bonusMode && sym.isWild ? 'bg-purple-500/20 border-purple-500/40 animate-pulse-gold' : ''}
                        ${!isWin && !(bonusMode && sym.isWild) ? 'bg-card border-border' : ''}
                        ${spinning ? 'blur-[1px] scale-95' : ''}
                      `}
                      style={{ height: '48px' }}
                    >
                      {sym.emoji}
                    </div>
                  );
                })}
                <div className="text-center text-xs text-muted-foreground/40">{reel.length}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
