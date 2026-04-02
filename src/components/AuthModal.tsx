import { useState } from 'react';
import { casinoStore } from '@/store/casinoStore';
import Icon from '@/components/ui/icon';

interface Props {
  onClose: () => void;
}

export default function AuthModal({ onClose }: Props) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = () => {
    setError('');
    setSuccess('');
    if (!username || !password) {
      setError('Заполните все поля');
      return;
    }
    if (tab === 'login') {
      const res = casinoStore.login(username, password);
      if (res.success) { onClose(); }
      else setError(res.message);
    } else {
      if (password.length < 6) { setError('Пароль минимум 6 символов'); return; }
      const res = casinoStore.register(username, password);
      if (res.success) {
        setSuccess(`Регистрация успешна! Ваш ID: ${res.user?.id}. Стартовый баланс: 1000 К`);
        setTimeout(() => onClose(), 2000);
      } else setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="card-dark w-full max-w-sm mx-4 p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-oswald text-xl gold-text tracking-wide">
            {tab === 'login' ? 'ВХОД' : 'РЕГИСТРАЦИЯ'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${tab === 'login' ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Вход
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${tab === 'register' ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Регистрация
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Имя пользователя</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="username"
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg">
              <Icon name="AlertCircle" size={14} />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-400/10 px-3 py-2 rounded-lg">
              <Icon name="CheckCircle" size={14} />
              {success}
            </div>
          )}

          <button onClick={handleSubmit} className="btn-gold w-full py-2.5 text-sm mt-2">
            {tab === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </div>

        {tab === 'register' && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            При регистрации вы получите уникальный ID и 1000 К на баланс
          </p>
        )}
      </div>
    </div>
  );
}
