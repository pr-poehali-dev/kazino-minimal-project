import { useState } from 'react';
import { useCasino, casinoStore, Bonus } from '@/store/casinoStore';
import Icon from '@/components/ui/icon';

type AdminTab = 'overview' | 'players' | 'bonuses' | 'reports' | 'admins';

export default function AdminPage() {
  const { currentUser, users, transactions, bonuses, stats } = useCasino();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Bonus form
  const [bonusForm, setBonusForm] = useState({ title: '', description: '', amount: 100, type: 'promo' as Bonus['type'], promoCode: '' });

  // Admin add form
  const [adminId, setAdminId] = useState('');

  // Balance add form
  const [balId, setBalId] = useState('');
  const [balAmount, setBalAmount] = useState(1000);

  if (!currentUser?.isAdmin) {
    return (
      <div className="animate-fade-in text-center py-20">
        <Icon name="ShieldOff" size={40} className="text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Доступ запрещён</p>
      </div>
    );
  }

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleAddAdmin = () => {
    if (!adminId.trim()) { showMsg('Введите ID', 'error'); return; }
    const res = casinoStore.addAdmin(adminId.trim().toUpperCase());
    showMsg(res.message, res.success ? 'success' : 'error');
    if (res.success) setAdminId('');
  };

  const handleAddBalance = () => {
    if (!balId.trim()) { showMsg('Введите ID', 'error'); return; }
    const user = users.find(u => u.id === balId.trim().toUpperCase());
    if (!user) { showMsg('Пользователь не найден', 'error'); return; }
    casinoStore.updateBalance(user.id, balAmount, 'bonus', `Пополнение от администратора`);
    showMsg(`+${balAmount} К начислено ${user.username}`, 'success');
    setBalId('');
  };

  const handleAddBonus = () => {
    if (!bonusForm.title || !bonusForm.description || !bonusForm.amount) {
      showMsg('Заполните все поля', 'error'); return;
    }
    casinoStore.addBonus(bonusForm);
    showMsg('Бонус добавлен', 'success');
    setBonusForm({ title: '', description: '', amount: 100, type: 'promo', promoCode: '' });
  };

  const TABS: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Обзор', icon: 'LayoutDashboard' },
    { id: 'players', label: 'Игроки', icon: 'Users' },
    { id: 'bonuses', label: 'Бонусы', icon: 'Gift' },
    { id: 'reports', label: 'Отчёты', icon: 'BarChart3' },
    { id: 'admins', label: 'Администраторы', icon: 'ShieldCheck' },
  ];

  const recentTx = [...transactions].reverse().slice(0, 20);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Icon name="ShieldCheck" size={16} className="gold-text" />
        </div>
        <div>
          <h1 className="font-oswald text-xl gold-text tracking-wide">ПАНЕЛЬ АДМИНИСТРАТОРА</h1>
          <p className="text-xs text-muted-foreground">Управление казино</p>
        </div>
      </div>

      {msg && (
        <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm animate-fade-in ${msg.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          <Icon name={msg.type === 'success' ? 'CheckCircle' : 'AlertCircle'} size={16} />
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'btn-gold' : 'card-dark text-muted-foreground hover:text-foreground'}`}
          >
            <Icon name={t.icon} size={14} fallback="Circle" />
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Всего игроков', value: stats.totalUsers, icon: 'Users', color: 'text-blue-400' },
              { label: 'Активных', value: stats.activeUsers, icon: 'UserCheck', color: 'text-green-400' },
              { label: 'Выручка (К)', value: stats.revenue.toLocaleString(), icon: 'TrendingUp', color: 'text-amber-400' },
              { label: 'Транзакций', value: stats.totalTransactions, icon: 'Activity', color: 'text-purple-400' },
            ].map(s => (
              <div key={s.label} className="card-dark p-4">
                <Icon name={s.icon} size={18} className={`${s.color} mb-2`} fallback="Circle" />
                <p className={`font-oswald text-2xl ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="card-dark p-4">
              <p className="text-xs text-muted-foreground mb-1">Всего выиграно</p>
              <p className="font-oswald text-xl text-green-400">{stats.totalWins.toLocaleString()} К</p>
            </div>
            <div className="card-dark p-4">
              <p className="text-xs text-muted-foreground mb-1">Всего проиграно</p>
              <p className="font-oswald text-xl text-red-400">{stats.totalLosses.toLocaleString()} К</p>
            </div>
            <div className="card-dark p-4">
              <p className="text-xs text-muted-foreground mb-1">Бонусов выдано</p>
              <p className="font-oswald text-xl gold-text">{stats.totalBonuses.toLocaleString()} К</p>
            </div>
          </div>

          {/* Quick balance add */}
          <div className="card-dark p-5">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Icon name="PlusCircle" size={15} className="gold-text" />
              Пополнить баланс игрока
            </h3>
            <div className="flex gap-2 flex-wrap">
              <input
                type="text"
                value={balId}
                onChange={e => setBalId(e.target.value.toUpperCase())}
                placeholder="ID игрока"
                className="flex-1 min-w-32 bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 font-mono uppercase"
              />
              <input
                type="number"
                value={balAmount}
                onChange={e => setBalAmount(parseInt(e.target.value) || 0)}
                className="w-28 bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              />
              <button onClick={handleAddBalance} className="btn-gold px-4 py-2 text-sm">
                Начислить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAYERS */}
      {tab === 'players' && (
        <div className="animate-fade-in">
          <div className="card-dark overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Пользователь</th>
                    <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">ID</th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Баланс</th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Игр</th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Выиграл</th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Проиграл</th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Статус</th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xs font-bold gold-text">
                            {user.username[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{user.username}</p>
                            {user.isAdmin && <span className="text-xs gold-text">admin</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{user.id}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium gold-text">{user.balance.toLocaleString()} К</td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">{user.gamesPlayed}</td>
                      <td className="px-4 py-3 text-right text-sm text-green-400">{user.totalWon.toLocaleString()} К</td>
                      <td className="px-4 py-3 text-right text-sm text-red-400">{user.totalLost.toLocaleString()} К</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${user.isBanned ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                          {user.isBanned ? 'Бан' : 'Активен'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {user.id !== currentUser.id && (
                          <button
                            onClick={() => { casinoStore.banUser(user.id); }}
                            className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${user.isBanned ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
                          >
                            {user.isBanned ? 'Разбанить' : 'Забанить'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* BONUSES */}
      {tab === 'bonuses' && (
        <div className="animate-fade-in space-y-4">
          {/* Add bonus form */}
          <div className="card-dark p-5 space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Icon name="PlusCircle" size={15} className="gold-text" />
              Создать бонус
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={bonusForm.title}
                onChange={e => setBonusForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Название бонуса"
                className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              />
              <input
                value={bonusForm.description}
                onChange={e => setBonusForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Описание"
                className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              />
              <input
                type="number"
                value={bonusForm.amount}
                onChange={e => setBonusForm(f => ({ ...f, amount: parseInt(e.target.value) || 0 }))}
                placeholder="Сумма К"
                className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              />
              <select
                value={bonusForm.type}
                onChange={e => setBonusForm(f => ({ ...f, type: e.target.value as Bonus['type'] }))}
                className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="welcome">Приветственный</option>
                <option value="daily">Ежедневный</option>
                <option value="promo">Промокод</option>
              </select>
              {bonusForm.type === 'promo' && (
                <input
                  value={bonusForm.promoCode}
                  onChange={e => setBonusForm(f => ({ ...f, promoCode: e.target.value.toUpperCase() }))}
                  placeholder="ПРОМОКОД"
                  className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 uppercase font-mono"
                />
              )}
            </div>
            <button onClick={handleAddBonus} className="btn-gold px-6 py-2 text-sm">
              Создать бонус
            </button>
          </div>

          {/* Bonuses list */}
          <div className="space-y-2">
            {bonuses.map(bonus => (
              <div key={bonus.id} className="card-dark p-4 flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium">{bonus.title}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${bonus.isActive ? 'bg-green-500/10 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                      {bonus.isActive ? 'Активен' : 'Отключён'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{bonus.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs gold-text font-medium">+{bonus.amount} К</span>
                    {bonus.promoCode && <span className="text-xs font-mono text-muted-foreground">{bonus.promoCode}</span>}
                    <span className="text-xs text-muted-foreground">Использовано: {bonus.usedBy.length}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => casinoStore.toggleBonus(bonus.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${bonus.isActive ? 'bg-muted text-muted-foreground hover:bg-secondary' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                  >
                    {bonus.isActive ? 'Отключить' : 'Включить'}
                  </button>
                  <button
                    onClick={() => casinoStore.deleteBonus(bonus.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REPORTS */}
      {tab === 'reports' && (
        <div className="animate-fade-in space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="card-dark p-5 text-center">
              <p className="text-xs text-muted-foreground mb-1">Чистая выручка</p>
              <p className={`font-oswald text-3xl ${stats.revenue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.revenue.toLocaleString()} К
              </p>
              <p className="text-xs text-muted-foreground mt-1">Проигрыши − Выигрыши</p>
            </div>
            <div className="card-dark p-5 text-center">
              <p className="text-xs text-muted-foreground mb-1">Ср. баланс игрока</p>
              <p className="font-oswald text-3xl gold-text">
                {stats.totalUsers ? Math.round(users.filter(u => !u.isAdmin).reduce((s, u) => s + u.balance, 0) / stats.totalUsers).toLocaleString() : 0} К
              </p>
            </div>
            <div className="card-dark p-5 text-center">
              <p className="text-xs text-muted-foreground mb-1">Переводов между игроками</p>
              <p className="font-oswald text-3xl text-blue-400">
                {transactions.filter(t => t.type === 'transfer').length}
              </p>
            </div>
          </div>

          {/* Transaction log */}
          <div className="card-dark p-5">
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
              <Icon name="ScrollText" size={15} className="gold-text" />
              Последние транзакции
            </h3>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {recentTx.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0 text-xs">
                  <span className={`px-1.5 py-0.5 rounded font-medium shrink-0 ${
                    tx.type === 'win' ? 'bg-green-500/10 text-green-400' :
                    tx.type === 'loss' ? 'bg-red-500/10 text-red-400' :
                    tx.type === 'bonus' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-blue-500/10 text-blue-400'
                  }`}>
                    {tx.type}
                  </span>
                  <span className="text-muted-foreground flex-1 truncate">{tx.description}</span>
                  <span className="font-mono text-muted-foreground shrink-0">{tx.fromId} → {tx.toId}</span>
                  <span className="font-semibold gold-text shrink-0">{tx.amount.toLocaleString()} К</span>
                  <span className="text-muted-foreground shrink-0">{new Date(tx.createdAt).toLocaleDateString('ru', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADMINS */}
      {tab === 'admins' && (
        <div className="animate-fade-in space-y-4">
          <div className="card-dark p-5 space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Icon name="UserPlus" size={15} className="gold-text" />
              Назначить администратора по ID
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={adminId}
                onChange={e => setAdminId(e.target.value.toUpperCase())}
                placeholder="ID пользователя (например USR12345)"
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 font-mono uppercase"
              />
              <button onClick={handleAddAdmin} className="btn-gold px-5 py-2 text-sm shrink-0">
                Назначить
              </button>
            </div>
          </div>

          <div className="card-dark overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-sm font-medium">Список администраторов</h3>
            </div>
            {users.filter(u => u.isAdmin).map(user => (
              <div key={user.id} className="flex items-center justify-between px-5 py-3 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-sm font-bold gold-text">
                    {user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.username}</p>
                    <p className="text-xs text-muted-foreground font-mono">{user.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 gold-text">Администратор</span>
                  {user.id !== currentUser.id && (
                    <button
                      onClick={() => casinoStore.removeAdmin(user.id)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      Снять права
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="card-dark p-4 border border-amber-500/10">
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <Icon name="Info" size={14} className="gold-text shrink-0 mt-0.5" />
              Чтобы назначить администратора, введите его ID. ID можно найти в разделе «Игроки» или в профиле пользователя.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
