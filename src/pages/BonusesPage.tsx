import { useState } from 'react';
import { useCasino, casinoStore } from '@/store/casinoStore';
import AuthModal from '@/components/AuthModal';
import Icon from '@/components/ui/icon';

export default function BonusesPage() {
  const { currentUser, bonuses } = useCasino();
  const [promoCode, setPromoCode] = useState('');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleClaim = (bonusId: string) => {
    if (!currentUser) { setShowAuth(true); return; }
    const res = casinoStore.claimBonus(currentUser.id, bonusId);
    showMsg(res.message, res.success ? 'success' : 'error');
  };

  const handlePromo = () => {
    if (!currentUser) { setShowAuth(true); return; }
    if (!promoCode.trim()) { showMsg('Введите промокод', 'error'); return; }
    const res = casinoStore.claimPromo(currentUser.id, promoCode.trim());
    showMsg(res.message, res.success ? 'success' : 'error');
    if (res.success) setPromoCode('');
  };

  const isClaimed = (bonusId: string) => currentUser ? bonuses.find(b => b.id === bonusId)?.usedBy.includes(currentUser.id) : false;

  const BONUS_ICONS: Record<string, string> = {
    welcome: 'Gift',
    daily: 'Calendar',
    promo: 'Tag',
  };

  return (
    <div className="animate-fade-in">
      <h1 className="font-oswald text-2xl gold-text tracking-wide mb-2">БОНУСЫ</h1>
      <p className="text-sm text-muted-foreground mb-6">Получай бонусные Казах Коины каждый день</p>

      {/* Alert */}
      {msg && (
        <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm animate-fade-in ${msg.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          <Icon name={msg.type === 'success' ? 'CheckCircle' : 'AlertCircle'} size={16} />
          {msg.text}
        </div>
      )}

      {/* Promo code */}
      <div className="card-dark p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="Tag" size={16} className="gold-text" />
          <h2 className="font-medium text-sm">Промокод</h2>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={promoCode}
            onChange={e => setPromoCode(e.target.value.toUpperCase())}
            placeholder="ВВЕДИТЕ ПРОМОКОД"
            onKeyDown={e => e.key === 'Enter' && handlePromo()}
            className="flex-1 bg-muted border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 uppercase tracking-widest"
          />
          <button onClick={handlePromo} className="btn-gold px-4 py-2 text-sm shrink-0">
            Активировать
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Попробуйте: <span className="gold-text font-medium">KAZAH500</span></p>
      </div>

      {/* Bonuses grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bonuses.filter(b => b.isActive && b.type !== 'promo').map(bonus => {
          const claimed = isClaimed(bonus.id);
          return (
            <div key={bonus.id} className={`card-dark p-5 flex flex-col gap-3 transition-all ${claimed ? 'opacity-60' : 'hover:border-amber-500/20'}`}>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Icon name={BONUS_ICONS[bonus.type] || 'Gift'} size={18} className="gold-text" fallback="Gift" />
                </div>
                <div className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <span className="text-sm font-oswald gold-text">+{bonus.amount} К</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">{bonus.title}</h3>
                <p className="text-xs text-muted-foreground">{bonus.description}</p>
              </div>
              <button
                onClick={() => handleClaim(bonus.id)}
                disabled={claimed}
                className={`w-full py-2.5 text-sm rounded-lg font-medium transition-all mt-auto ${
                  claimed ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'btn-gold'
                }`}
              >
                {claimed ? (
                  <span className="flex items-center justify-center gap-2"><Icon name="Check" size={14} /> Получено</span>
                ) : 'Получить бонус'}
              </button>
            </div>
          );
        })}
      </div>

      {!currentUser && (
        <div className="mt-6 card-dark p-6 text-center">
          <Icon name="Lock" size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">Войдите чтобы получать бонусы</p>
          <button onClick={() => setShowAuth(true)} className="btn-gold px-6 py-2 text-sm">
            Войти
          </button>
        </div>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
