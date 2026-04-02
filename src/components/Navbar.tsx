import { useState } from 'react';
import { casinoStore } from '@/store/casinoStore';
import { useCasino } from '@/store/casinoStore';
import AuthModal from './AuthModal';
import Icon from '@/components/ui/icon';

type Page = 'home' | 'games' | 'bonuses' | 'transfer' | 'admin';

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Navbar({ currentPage, onNavigate }: Props) {
  const { currentUser } = useCasino();
  const [showAuth, setShowAuth] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const navItems = [
    { id: 'home' as Page, label: 'Главная', icon: 'Home' },
    { id: 'games' as Page, label: 'Игры', icon: 'Gamepad2' },
    { id: 'bonuses' as Page, label: 'Бонусы', icon: 'Gift' },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2 shrink-0">
            <span className="text-lg font-oswald gold-text tracking-widest">KAZAH</span>
            <span className="text-xs font-medium text-muted-foreground">CASINO</span>
          </button>

          {/* Nav items desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`nav-item flex items-center gap-1.5 text-sm font-medium ${currentPage === item.id ? 'active' : ''}`}
              >
                <Icon name={item.icon} size={15} fallback="Circle" />
                {item.label}
              </button>
            ))}
            {currentUser?.isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className={`nav-item flex items-center gap-1.5 text-sm font-medium ${currentPage === 'admin' ? 'active' : ''}`}
              >
                <Icon name="ShieldCheck" size={15} />
                Админ
              </button>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {currentUser ? (
              <>
                <button
                  onClick={() => onNavigate('transfer')}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-sm hover:bg-secondary transition-colors"
                >
                  <Icon name="ArrowLeftRight" size={14} />
                  <span className="text-muted-foreground">Перевод</span>
                </button>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                  <Icon name="Coins" size={14} className="gold-text" />
                  <span className="text-sm font-semibold gold-text">{currentUser.balance.toLocaleString()} К</span>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                      <span className="text-xs font-bold gold-text">{currentUser.username[0].toUpperCase()}</span>
                    </div>
                    <Icon name="ChevronDown" size={12} className="text-muted-foreground" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-1 w-56 card-dark rounded-xl overflow-hidden shadow-2xl animate-scale-in z-50">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-semibold">{currentUser.username}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">ID: {currentUser.id}</p>
                        {currentUser.isAdmin && (
                          <span className="text-xs gold-text font-medium">Администратор</span>
                        )}
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => { onNavigate('transfer'); setShowMenu(false); }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Icon name="ArrowLeftRight" size={14} />
                          Переводы
                        </button>
                        {currentUser.isAdmin && (
                          <button
                            onClick={() => { onNavigate('admin'); setShowMenu(false); }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Icon name="ShieldCheck" size={14} />
                            Панель Admin
                          </button>
                        )}
                        <button
                          onClick={() => { casinoStore.logout(); setShowMenu(false); }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/5 transition-colors"
                        >
                          <Icon name="LogOut" size={14} />
                          Выйти
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button onClick={() => setShowAuth(true)} className="btn-gold px-4 py-2 text-sm">
                Войти
              </button>
            )}

            {/* Mobile menu */}
            <button className="md:hidden nav-item p-1.5" onClick={() => setShowMenu(!showMenu)}>
              <Icon name="Menu" size={20} />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {showMenu && (
          <div className="md:hidden border-t border-border bg-card py-2 px-4 animate-fade-in">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setShowMenu(false); }}
                className={`nav-item w-full flex items-center gap-2 text-sm py-2 ${currentPage === item.id ? 'active' : ''}`}
              >
                <Icon name={item.icon} size={16} fallback="Circle" />
                {item.label}
              </button>
            ))}
            {currentUser && (
              <button
                onClick={() => { onNavigate('transfer'); setShowMenu(false); }}
                className="nav-item w-full flex items-center gap-2 text-sm py-2"
              >
                <Icon name="ArrowLeftRight" size={16} />
                Переводы
              </button>
            )}
            {currentUser?.isAdmin && (
              <button
                onClick={() => { onNavigate('admin'); setShowMenu(false); }}
                className="nav-item w-full flex items-center gap-2 text-sm py-2"
              >
                <Icon name="ShieldCheck" size={16} />
                Админ панель
              </button>
            )}
          </div>
        )}
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
