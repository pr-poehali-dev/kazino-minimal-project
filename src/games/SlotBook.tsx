import { useState, useRef, useEffect } from 'react';
import { casinoStore, useCasino } from '@/store/casinoStore';

// 5 reels × 3 rows
const COLS = 5;
const ROWS = 3;

const SYMS = [
  { id: 'book',   emoji: '📖', w: 4,  pay3: 18, pay4: 90,  pay5: 900,  isWild: true, isScatter: true },
  { id: 'pharaoh',emoji: '🗿', w: 6,  pay3: 15, pay4: 60,  pay5: 600  },
  { id: 'eye',    emoji: '👁', w: 8,  pay3: 10, pay4: 40,  pay5: 400  },
  { id: 'scarab', emoji: '🪲', w: 12, pay3: 6,  pay4: 20,  pay5: 200  },
  { id: 'ankh',   emoji: '☥', w: 16, pay3: 4,  pay4: 12,  pay5: 100  },
  { id: 'a',      emoji: 'A',  w: 20, pay3: 2,  pay4: 8,   pay5: 50   },
  { id: 'k',      emoji: 'K',  w: 22, pay3: 2,  pay4: 6,   pay5: 40   },
  { id: 'q',      emoji: 'Q',  w: 26, pay3: 1,  pay4: 4,   pay5: 25   },
];

const TOTAL_W = SYMS.reduce((s, x) => s + x.w, 0);

function randSym(forBonus = false): typeof SYMS[0] {
  // In bonus, book appears more often
  const syms = forBonus
    ? [...SYMS, SYMS[0], SYMS[0], SYMS[0]]
    : SYMS;
  const total = syms.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * total;
  for (const s of syms) { r -= s.w; if (r <= 0) return s; }
  return SYMS[SYMS.length - 1];
}

function makeGrid(forBonus = false): typeof SYMS[0][][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => randSym(forBonus))
  );
}

// 20 paylines (standard Book-of-Ra style)
const PAYLINES: number[][] = [
  [1,1,1,1,1], // middle row
  [0,0,0,0,0], // top row
  [2,2,2,2,2], // bottom row
  [0,1,2,1,0], // V-shape
  [2,1,0,1,2], // ^-shape
  [1,0,1,0,1],
  [1,2,1,2,1],
  [0,0,1,2,2],
  [2,2,1,0,0],
  [1,0,0,0,1],
  [1,2,2,2,1],
  [0,1,1,1,0],
  [2,1,1,1,2],
  [0,1,0,1,0],
  [2,1,2,1,2],
  [1,1,0,1,1],
  [1,1,2,1,1],
  [0,0,2,0,0],
  [2,2,0,2,2],
  [0,2,1,2,0],
];

type WinLine = { line: number; sym: string; count: number; mult: number; cells: [number,number][] };

function calcWins(grid: typeof SYMS[0][][], bet: number, lines: number): { wins: WinLine[]; total: number; scatters: number } {
  const wins: WinLine[] = [];
  let total = 0;

  // Count scatters (book anywhere on grid)
  let scatters = 0;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c].isScatter) scatters++;

  // Scatter win
  if (scatters >= 3) {
    const sym = SYMS[0];
    const mult = scatters === 3 ? sym.pay3 : scatters === 4 ? sym.pay4 : sym.pay5;
    const winAmt = Math.floor((bet / lines) * mult);
    total += winAmt;
    wins.push({ line: -1, sym: sym.emoji, count: scatters, mult, cells: [] });
  }

  // Payline wins
  for (let li = 0; li < lines; li++) {
    const pl = PAYLINES[li];
    const rowSym = grid[pl[0]][0];
    let count = 1;
    const cells: [number,number][] = [[pl[0], 0]];

    for (let c = 1; c < COLS; c++) {
      const cell = grid[pl[c]][c];
      if (cell.id === rowSym.id || cell.isWild || rowSym.isWild) {
        count++;
        cells.push([pl[c], c]);
      } else break;
    }

    if (count >= 3) {
      const sym = rowSym.isWild
        ? grid[pl[0]][0]
        : rowSym;
      const mult = count === 3 ? sym.pay3 : count === 4 ? sym.pay4 : sym.pay5;
      if (mult > 0) {
        const winAmt = Math.floor((bet / lines) * mult);
        total += winAmt;
        wins.push({ line: li, sym: sym.emoji, count, mult, cells });
      }
    }
  }

  return { wins, total, scatters };
}

// Expanding symbol in free spins
function calcBonusWins(grid: typeof SYMS[0][][], bet: number, expandSym: typeof SYMS[0]): { wins: WinLine[]; total: number; scatters: number } {
  // Expand symbol fills entire reel if present
  const expanded = grid.map(row =>
    row.map((cell, c) => {
      const reelHas = grid.some(r => r[c].id === expandSym.id);
      return reelHas ? expandSym : cell;
    })
  );
  return calcWins(expanded, bet, 20);
}

const BET_LEVELS = [10, 20, 50, 100, 200, 500, 1000];
const LINE_OPTIONS = [5, 10, 20];
const BONUS_COST_MULT = 100; // buy bonus costs bet × 100

export default function SlotBook() {
  const { currentUser } = useCasino();
  const [betLevel, setBetLevel] = useState(2); // index into BET_LEVELS
  const [lines, setLines] = useState(20);
  const [grid, setGrid] = useState<typeof SYMS[0][][]>(makeGrid);
  const [spinning, setSpinning] = useState(false);
  const [winData, setWinData] = useState<{ wins: WinLine[]; total: number; scatters: number } | null>(null);
  const [highlightCells, setHighlightCells] = useState<Set<string>>(new Set());

  // Bonus / free spins
  const [bonusMode, setBonusMode] = useState(false);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [freeSpinsTotal, setFreeSpinsTotal] = useState(0);
  const [expandSym, setExpandSym] = useState<typeof SYMS[0] | null>(null);
  const [bonusWinTotal, setBonusWinTotal] = useState(0);
  const [bonusMsg, setBonusMsg] = useState('');
  const [showBonusBanner, setShowBonusBanner] = useState(false);

  const spinning$ = useRef(false);
  const bet = BET_LEVELS[betLevel];
  const totalBet = bet * lines;

  const doSpin = (isBonus = false, fsLeft = freeSpinsLeft) => {
    if (spinning$.current) return;
    spinning$.current = true;
    setSpinning(true);
    setWinData(null);
    setHighlightCells(new Set());

    if (!isBonus) {
      casinoStore.updateBalance(currentUser!.id, -totalBet, 'loss', `Слот Книга: ставка ${totalBet} К`);
    }

    const STEPS = 14;
    let step = 0;
    const finalGrid = makeGrid(isBonus);

    const iv = setInterval(() => {
      step++;
      if (step < STEPS) {
        setGrid(makeGrid(isBonus));
      } else {
        clearInterval(iv);
        setGrid(finalGrid);
        spinning$.current = false;
        setSpinning(false);

        // Calculate result
        const result = isBonus && expandSym
          ? calcBonusWins(finalGrid, totalBet, expandSym)
          : calcWins(finalGrid, totalBet, lines);

        setWinData(result);

        // Highlight winning cells
        const cells = new Set<string>();
        result.wins.forEach(w => w.cells.forEach(([r, c]) => cells.add(`${r}-${c}`)));
        setHighlightCells(cells);

        if (result.total > 0) {
          casinoStore.updateBalance(currentUser!.id, result.total, 'win',
            `Слот Книга: ${isBonus ? 'фриспин' : 'выигрыш'} ${result.total} К`);
          if (isBonus) setBonusWinTotal(p => p + result.total);
        }

        // Handle free spins state
        if (isBonus) {
          const remaining = fsLeft - 1;
          setFreeSpinsLeft(remaining);
          if (remaining > 0) {
            setTimeout(() => doSpin(true, remaining), 1200);
          } else {
            // Bonus ended
            setBonusMode(false);
            setBonusMsg(`Фриспины окончены! Выиграно: ${bonusWinTotal + result.total} К`);
            setTimeout(() => setBonusMsg(''), 4000);
          }
        } else if (result.scatters >= 3) {
          // Trigger free spins
          const spins = result.scatters === 3 ? 10 : result.scatters === 4 ? 15 : 20;
          const expand = SYMS[Math.floor(Math.random() * (SYMS.length - 3))];
          setExpandSym(expand);
          setFreeSpinsLeft(spins);
          setFreeSpinsTotal(spins);
          setBonusWinTotal(0);
          setShowBonusBanner(true);
          setTimeout(() => {
            setShowBonusBanner(false);
            setBonusMode(true);
            doSpin(true, spins);
          }, 2500);
        }
      }
    }, 75);
  };

  const handleSpin = () => {
    if (!currentUser || spinning || currentUser.balance < totalBet) return;
    doSpin(false);
  };

  const buyBonus = () => {
    const cost = totalBet * BONUS_COST_MULT;
    if (!currentUser || currentUser.balance < cost) return;
    casinoStore.updateBalance(currentUser.id, -cost, 'loss', `Слот Книга: покупка бонуса ${cost} К`);
    const expand = SYMS[Math.floor(Math.random() * (SYMS.length - 3))];
    setExpandSym(expand);
    setFreeSpinsLeft(10);
    setFreeSpinsTotal(10);
    setBonusWinTotal(0);
    setShowBonusBanner(true);
    setTimeout(() => {
      setShowBonusBanner(false);
      setBonusMode(true);
      doSpin(true, 10);
    }, 2500);
  };

  const bonusCost = totalBet * BONUS_COST_MULT;

  return (
    <div className="animate-fade-in relative">
      {/* Bonus banner */}
      {showBonusBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="text-center animate-scale-in">
            <div className="text-7xl mb-4 animate-pulse-gold">📖</div>
            <p className="font-oswald text-4xl gold-text tracking-widest mb-2">БОНУСНАЯ ИГРА!</p>
            <p className="text-muted-foreground text-lg">{freeSpinsTotal} фриспинов</p>
            {expandSym && (
              <p className="text-2xl mt-3">Расширяющийся символ: <span className="gold-text">{expandSym.emoji}</span></p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <span className="text-xl">📖</span>
        </div>
        <div>
          <h2 className="font-oswald text-lg gold-text tracking-wide">КНИГА УДАЧИ</h2>
          <p className="text-xs text-muted-foreground">5×3 · 20 линий · Бонусная игра · Расширяющийся символ</p>
        </div>
        {bonusMode && (
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl animate-pulse-gold">
            <span className="text-sm font-oswald gold-text">ФРИСПИНЫ</span>
            <span className="text-xl font-oswald gold-text">{freeSpinsLeft}</span>
          </div>
        )}
      </div>

      {bonusMsg && (
        <div className="mb-4 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm font-medium animate-fade-in">
          🎉 {bonusMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        {/* Controls */}
        <div className="space-y-3">
          {/* Bet level */}
          <div className="card-dark p-4 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-muted-foreground">Уровень ставки</label>
                <span className="text-xs font-semibold gold-text">{bet} К / линия</span>
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

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-muted-foreground">Линии</label>
                <span className="text-xs font-semibold gold-text">{lines}</span>
              </div>
              <div className="flex gap-1.5">
                {LINE_OPTIONS.map(l => (
                  <button
                    key={l}
                    onClick={() => setLines(l)}
                    disabled={spinning || bonusMode}
                    className={`flex-1 py-1.5 text-xs rounded-lg transition-all disabled:opacity-50 ${lines === l ? 'btn-gold' : 'bg-muted hover:bg-secondary'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-border">
              <span className="text-xs text-muted-foreground">Общая ставка</span>
              <span className="text-sm font-oswald gold-text">{totalBet} К</span>
            </div>
          </div>

          {/* Result */}
          {winData && !bonusMode && (
            <div className={`card-dark p-4 animate-scale-in ${winData.total > 0 ? 'border-green-500/20' : ''}`}>
              {winData.total > 0 ? (
                <>
                  <p className="text-green-400 font-oswald text-xl text-center">+{winData.total} К</p>
                  {winData.wins.slice(0, 3).map((w, i) => (
                    <p key={i} className="text-xs text-muted-foreground text-center mt-1">
                      {w.line === -1 ? '📖 Scatter' : `Линия ${w.line + 1}`}: {w.sym}×{w.count} = x{w.mult}
                    </p>
                  ))}
                </>
              ) : (
                <p className="text-muted-foreground text-sm text-center">Не повезло...</p>
              )}
            </div>
          )}

          {/* Bonus win tracker */}
          {bonusMode && (
            <div className="card-dark p-4 border border-amber-500/20 animate-scale-in">
              <p className="text-xs text-muted-foreground text-center">Выиграно в бонусе</p>
              <p className="font-oswald text-2xl gold-text text-center">{bonusWinTotal} К</p>
              {expandSym && (
                <p className="text-center mt-1 text-sm">Расш: <span className="gold-text">{expandSym.emoji}</span></p>
              )}
            </div>
          )}

          {/* Paytable */}
          <div className="card-dark p-3">
            <p className="text-xs text-muted-foreground mb-2">Таблица выплат (×ставку на линию)</p>
            <div className="space-y-1">
              {SYMS.slice(0, 6).map(s => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <span className="w-16">{s.emoji}{s.isScatter ? ' 🌟' : ''}</span>
                  <div className="flex gap-2 text-muted-foreground">
                    <span>3→<span className="gold-text">{s.pay3}</span></span>
                    <span>4→<span className="gold-text">{s.pay4}</span></span>
                    <span>5→<span className="gold-text">{s.pay5}</span></span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">📖 = Wild + Scatter. 3+ скаттера = 10 фриспинов</p>
          </div>

          {/* Buttons */}
          {!currentUser && <p className="text-xs text-muted-foreground text-center">Войдите чтобы играть</p>}

          <button
            onClick={handleSpin}
            disabled={spinning || bonusMode || !currentUser || (currentUser?.balance ?? 0) < totalBet}
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
          <p className="text-xs text-muted-foreground text-center -mt-1">Гарантированно 10 фриспинов</p>
        </div>

        {/* Grid */}
        <div className={`card-dark p-4 flex items-center justify-center transition-all ${bonusMode ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
          <div className="w-full">
            {bonusMode && (
              <div className="text-center mb-3">
                <span className="text-xs font-medium gold-text">
                  🎰 БОНУСНАЯ ИГРА — осталось {freeSpinsLeft} из {freeSpinsTotal} фриспинов
                </span>
              </div>
            )}
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: COLS }, (_, c) =>
                Array.from({ length: ROWS }, (_, r) => {
                  const cell = grid[r][c];
                  const isWin = highlightCells.has(`${r}-${c}`);
                  const isExpanding = bonusMode && expandSym && cell.id === expandSym.id;
                  return (
                    <div
                      key={`${r}-${c}`}
                      style={{ gridRow: r + 1, gridColumn: c + 1 }}
                      className={`
                        aspect-square flex items-center justify-center rounded-xl border text-2xl md:text-3xl transition-all
                        ${isExpanding ? 'bg-amber-500/30 border-amber-500 scale-105 animate-pulse-gold' : ''}
                        ${isWin && !isExpanding ? 'bg-green-500/20 border-green-500/60' : ''}
                        ${!isWin && !isExpanding ? 'bg-card border-border' : ''}
                        ${spinning ? 'blur-[1px] scale-95' : ''}
                      `}
                    >
                      {cell.id === 'a' || cell.id === 'k' || cell.id === 'q'
                        ? <span className={`font-oswald text-lg font-bold ${isWin ? 'text-green-400' : 'text-muted-foreground'}`}>{cell.emoji}</span>
                        : cell.emoji
                      }
                    </div>
                  );
                })
              )}
            </div>
            {/* Reel labels */}
            <div className="grid grid-cols-5 gap-1.5 mt-1">
              {Array.from({ length: COLS }, (_, c) => (
                <div key={c} className="text-center text-xs text-muted-foreground/40">{c + 1}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
