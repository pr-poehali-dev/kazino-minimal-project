import { useState } from 'react';
import { useCasino } from '@/store/casinoStore';
import AuthModal from '@/components/AuthModal';
import Icon from '@/components/ui/icon';

interface Props {
  onNavigate: (page: 'home' | 'games' | 'bonuses' | 'transfer' | 'admin') => void;
}

export default function HomePage({ onNavigate }: Props) {
  const { currentUser, stats } = useCasino();
  const [showAuth, setShowAuth] = useState(false);

  const games = [
    { id: 'miner', name: 'Минёр', emoji: '💣', desc: 'Открывай клетки, избегай мин. Чем дальше — тем выше множитель!', tag: 'Навык' },
    { id: 'crash', name: 'Краш', emoji: '🚀', desc: 'Успей забрать ставку до краша. Риск = награда!', tag: 'Хайп' },
    { id: 'slot_book', name: 'Книга Удачи', emoji: '📖', desc: '5×3 · 20 линий · Бонусная игра · Расширяющийся символ · Покупка бонуса.', tag: 'Бонус' },
    { id: 'slot_mega', name: 'Megaways Blast', emoji: '🌟', desc: '6 барабанов · Случайные высоты · Каскады · Нарастающий × в бонусе.', tag: 'Mega×' },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-muted to-card border border-border p-8 md:p-12 text-center">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, hsl(43 90% 52%), transparent 70%)' }} />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs gold-text mb-4">
            <Icon name="Zap" size={12} />
            Играй и выигрывай прямо сейчас
          </div>
          <h1 className="font-oswald text-4xl md:text-6xl gold-text tracking-wider mb-3">KAZAH CASINO</h1>
          <p className="text-muted-foreground text-sm md:text-base mb-6 max-w-md mx-auto">
            Лучшее онлайн казино с Казах Коинами. 4 увлекательные игры, система переводов и ежедневные бонусы.
          </p>
          {currentUser ? (
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 card-dark rounded-xl">
                <Icon name="Coins" size={16} className="gold-text" />
                <span className="font-semibold gold-text">{currentUser.balance.toLocaleString()} К</span>
              </div>
              <button onClick={() => onNavigate('games')} className="btn-gold px-6 py-2.5 text-sm">
                Играть
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)} className="btn-gold px-8 py-3 text-sm">
              Начать играть — 1000 К бесплатно
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Игроков', value: stats.totalUsers, icon: 'Users' },
          { label: 'Игр сыграно', value: (stats.totalTransactions * 3).toLocaleString(), icon: 'Gamepad2' },
          { label: 'Выдано бонусов К', value: stats.totalBonuses.toLocaleString(), icon: 'Gift' },
          { label: 'Транзакций', value: stats.totalTransactions, icon: 'ArrowLeftRight' },
        ].map(s => (
          <div key={s.label} className="card-dark p-4 text-center">
            <Icon name={s.icon} size={20} className="gold-text mx-auto mb-2" fallback="Circle" />
            <p className="font-oswald text-xl gold-text">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Games preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-oswald text-xl tracking-wide">ИГРЫ</h2>
          <button onClick={() => onNavigate('games')} className="text-xs gold-text hover:underline flex items-center gap-1">
            Все игры <Icon name="ChevronRight" size={12} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {games.map(game => (
            <button
              key={game.id}
              onClick={() => onNavigate('games')}
              className="card-dark p-4 text-left hover:border-amber-500/30 transition-all hover:bg-amber-500/5 group"
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{game.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{game.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded gold-bg text-black font-medium">{game.tag}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{game.desc}</p>
                </div>
                <Icon name="ChevronRight" size={16} className="text-muted-foreground group-hover:gold-text transition-colors shrink-0 mt-0.5" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Transfer promo */}
      {currentUser && (
        <div className="card-dark p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Icon name="ArrowLeftRight" size={18} className="gold-text" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">Система переводов</p>
            <p className="text-xs text-muted-foreground">Отправляй К другим игрокам по их ID</p>
          </div>
          <button onClick={() => onNavigate('transfer')} className="btn-ghost-gold px-4 py-2 text-sm shrink-0">
            Перевести
          </button>
        </div>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}