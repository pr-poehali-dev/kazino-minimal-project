import { useState } from 'react';
import { useCasino, casinoStore } from '@/store/casinoStore';
import Icon from '@/components/ui/icon';

export default function TransferPage() {
  const { currentUser, transactions } = useCasino();
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState(100);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!currentUser) {
    return (
      <div className="animate-fade-in text-center py-20">
        <Icon name="Lock" size={40} className="text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Войдите чтобы делать переводы</p>
      </div>
    );
  }

  const myTransactions = transactions.filter(t => t.fromId === currentUser.id || t.toId === currentUser.id).slice(-15).reverse();

  const handleTransfer = () => {
    if (!toId.trim()) { setMsg({ text: 'Введите ID получателя', type: 'error' }); return; }
    const res = casinoStore.transfer(currentUser.id, toId.trim().toUpperCase(), amount);
    setMsg({ text: res.message, type: res.success ? 'success' : 'error' });
    if (res.success) { setToId(''); }
    setTimeout(() => setMsg(null), 4000);
  };

  const typeLabels: Record<string, string> = {
    transfer: 'Перевод', win: 'Выигрыш', loss: 'Ставка', bonus: 'Бонус', deposit: 'Пополнение',
  };
  const typeColors: Record<string, string> = {
    win: 'text-green-400', loss: 'text-red-400', bonus: 'text-amber-400', transfer: 'text-blue-400', deposit: 'text-green-400',
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-oswald text-2xl gold-text tracking-wide mb-1">ПЕРЕВОДЫ</h1>
        <p className="text-sm text-muted-foreground">Отправляй Казах Коины другим игрокам по их ID</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transfer form */}
        <div className="space-y-4">
          {/* My info */}
          <div className="card-dark p-4">
            <p className="text-xs text-muted-foreground mb-2">Мой аккаунт</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{currentUser.username}</p>
                <p className="text-xs text-muted-foreground mt-0.5">ID: <span className="font-mono text-foreground">{currentUser.id}</span></p>
              </div>
              <div className="text-right">
                <p className="font-oswald text-lg gold-text">{currentUser.balance.toLocaleString()} К</p>
                <p className="text-xs text-muted-foreground">Баланс</p>
              </div>
            </div>
          </div>

          <div className="card-dark p-5 space-y-4">
            <h2 className="font-medium text-sm flex items-center gap-2">
              <Icon name="Send" size={16} className="gold-text" />
              Новый перевод
            </h2>

            {msg && (
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm animate-fade-in ${msg.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                <Icon name={msg.type === 'success' ? 'CheckCircle' : 'AlertCircle'} size={14} />
                {msg.text}
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">ID получателя</label>
              <input
                type="text"
                value={toId}
                onChange={e => setToId(e.target.value.toUpperCase())}
                placeholder="Например: USR12345"
                className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 font-mono uppercase"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Сумма (К)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {[100, 500, 1000, 5000].map(v => (
                  <button key={v} onClick={() => setAmount(v)} className="text-xs py-1.5 bg-muted rounded-md hover:bg-secondary transition-colors">
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleTransfer}
              disabled={currentUser.balance < amount}
              className="btn-gold w-full py-2.5 text-sm disabled:opacity-40"
            >
              <span className="flex items-center justify-center gap-2">
                <Icon name="Send" size={14} />
                Отправить {amount.toLocaleString()} К
              </span>
            </button>
          </div>
        </div>

        {/* Transaction history */}
        <div className="card-dark p-5">
          <h2 className="font-medium text-sm flex items-center gap-2 mb-4">
            <Icon name="History" size={16} className="gold-text" />
            История операций
          </h2>
          {myTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">История пуста</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {myTransactions.map(tx => {
                const isIncoming = tx.toId === currentUser.id;
                const sign = (tx.type === 'loss') ? '-' : isIncoming ? '+' : '-';
                const colorClass = tx.type === 'win' || tx.type === 'bonus' || (tx.type === 'transfer' && isIncoming)
                  ? 'text-green-400'
                  : 'text-red-400';
                return (
                  <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{tx.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {typeLabels[tx.type]} · {new Date(tx.createdAt).toLocaleDateString('ru', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ml-3 shrink-0 ${colorClass}`}>
                      {sign}{tx.amount.toLocaleString()} К
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
