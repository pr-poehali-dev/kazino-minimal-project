import { useState, useEffect } from 'react';

export type User = {
  id: string;
  username: string;
  password: string;
  balance: number;
  isAdmin: boolean;
  isBanned: boolean;
  createdAt: string;
  totalWon: number;
  totalLost: number;
  gamesPlayed: number;
};

export type Transaction = {
  id: string;
  fromId: string;
  toId: string;
  amount: number;
  type: 'transfer' | 'win' | 'loss' | 'bonus' | 'deposit';
  description: string;
  createdAt: string;
};

export type Bonus = {
  id: string;
  title: string;
  description: string;
  amount: number;
  type: 'welcome' | 'daily' | 'promo';
  isActive: boolean;
  promoCode?: string;
  usedBy: string[];
};

const generateId = () => Math.random().toString(36).slice(2, 10).toUpperCase();

// ── LocalStorage helpers ──────────────────────────────────────────────────────
const LS_USERS        = 'kazah_users';
const LS_TRANSACTIONS = 'kazah_transactions';
const LS_BONUSES      = 'kazah_bonuses';
const LS_CURRENT_USER = 'kazah_current_user_id';

function lsGet<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
}
function lsSet(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

// ── Default data ──────────────────────────────────────────────────────────────
const DEFAULT_USERS: User[] = [
  {
    id: 'ADMIN001',
    username: 'admin',
    password: 'admin123',
    balance: 999999,
    isAdmin: true,
    isBanned: false,
    createdAt: new Date().toISOString(),
    totalWon: 0,
    totalLost: 0,
    gamesPlayed: 0,
  },
  {
    id: 'USR12345',
    username: 'player1',
    password: '123456',
    balance: 5000,
    isAdmin: false,
    isBanned: false,
    createdAt: new Date().toISOString(),
    totalWon: 1200,
    totalLost: 800,
    gamesPlayed: 47,
  },
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: generateId(),
    fromId: 'SYSTEM',
    toId: 'USR12345',
    amount: 1000,
    type: 'bonus',
    description: 'Приветственный бонус',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const DEFAULT_BONUSES: Bonus[] = [
  {
    id: 'BON001',
    title: 'Приветственный бонус',
    description: 'Получи 1000 К при регистрации',
    amount: 1000,
    type: 'welcome',
    isActive: true,
    usedBy: [],
  },
  {
    id: 'BON002',
    title: 'Ежедневный бонус',
    description: 'Заходи каждый день и получай 200 К',
    amount: 200,
    type: 'daily',
    isActive: true,
    usedBy: [],
  },
  {
    id: 'BON003',
    title: 'Промокод KAZAH500',
    description: 'Введи промокод и получи 500 К',
    amount: 500,
    type: 'promo',
    isActive: true,
    promoCode: 'KAZAH500',
    usedBy: [],
  },
];

// ── Инициализация из localStorage (или defaults) ──────────────────────────────
let users: User[]           = lsGet<User[]>(LS_USERS)           ?? [...DEFAULT_USERS];
let transactions: Transaction[] = lsGet<Transaction[]>(LS_TRANSACTIONS) ?? [...DEFAULT_TRANSACTIONS];
let bonuses: Bonus[]        = lsGet<Bonus[]>(LS_BONUSES)        ?? [...DEFAULT_BONUSES];

// Восстанавливаем текущего пользователя по сохранённому ID
const savedUserId = lsGet<string>(LS_CURRENT_USER);
let currentUser: User | null = savedUserId
  ? (users.find(u => u.id === savedUserId) ?? null)
  : null;

let listeners: (() => void)[] = [];

function persist() {
  lsSet(LS_USERS, users);
  lsSet(LS_TRANSACTIONS, transactions);
  lsSet(LS_BONUSES, bonuses);
  lsSet(LS_CURRENT_USER, currentUser?.id ?? null);
}

const notify = () => {
  persist();
  listeners.forEach(l => l());
};

// ── Store ─────────────────────────────────────────────────────────────────────
export const casinoStore = {
  getUsers: () => users,
  getTransactions: () => transactions,
  getBonuses: () => bonuses,
  getCurrentUser: () => currentUser,

  subscribe: (listener: () => void) => {
    listeners.push(listener);
    return () => { listeners = listeners.filter(l => l !== listener); };
  },

  register: (username: string, password: string): { success: boolean; message: string; user?: User } => {
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, message: 'Имя пользователя уже занято' };
    }
    const newUser: User = {
      id: generateId(),
      username,
      password,
      balance: 1000,
      isAdmin: false,
      isBanned: false,
      createdAt: new Date().toISOString(),
      totalWon: 0,
      totalLost: 0,
      gamesPlayed: 0,
    };
    users = [...users, newUser];
    transactions = [...transactions, {
      id: generateId(),
      fromId: 'SYSTEM',
      toId: newUser.id,
      amount: 1000,
      type: 'bonus',
      description: 'Приветственный бонус при регистрации',
      createdAt: new Date().toISOString(),
    }];
    currentUser = newUser;
    notify();
    return { success: true, message: 'Регистрация успешна', user: newUser };
  },

  login: (username: string, password: string): { success: boolean; message: string } => {
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return { success: false, message: 'Неверный логин или пароль' };
    if (user.isBanned) return { success: false, message: 'Аккаунт заблокирован' };
    currentUser = user;
    notify();
    return { success: true, message: 'Добро пожаловать!' };
  },

  logout: () => {
    currentUser = null;
    notify();
  },

  updateBalance: (userId: string, delta: number, type: Transaction['type'], description: string) => {
    users = users.map(u => {
      if (u.id === userId) {
        const updated = { ...u, balance: u.balance + delta };
        if (delta > 0 && type === 'win') updated.totalWon = u.totalWon + delta;
        if (delta < 0 && type === 'loss') updated.totalLost = u.totalLost + Math.abs(delta);
        if (type === 'win' || type === 'loss') updated.gamesPlayed = u.gamesPlayed + 1;
        if (currentUser?.id === userId) currentUser = updated;
        return updated;
      }
      return u;
    });
    transactions = [...transactions, {
      id: generateId(),
      fromId: delta < 0 ? userId : 'SYSTEM',
      toId: delta > 0 ? userId : 'SYSTEM',
      amount: Math.abs(delta),
      type,
      description,
      createdAt: new Date().toISOString(),
    }];
    notify();
  },

  transfer: (fromId: string, toId: string, amount: number): { success: boolean; message: string } => {
    const from = users.find(u => u.id === fromId);
    const to = users.find(u => u.id === toId);
    if (!to) return { success: false, message: 'Получатель с таким ID не найден' };
    if (!from) return { success: false, message: 'Ошибка отправителя' };
    if (from.balance < amount) return { success: false, message: 'Недостаточно средств' };
    if (amount <= 0) return { success: false, message: 'Сумма должна быть больше 0' };
    if (fromId === toId) return { success: false, message: 'Нельзя перевести себе' };

    users = users.map(u => {
      if (u.id === fromId) {
        const updated = { ...u, balance: u.balance - amount };
        if (currentUser?.id === fromId) currentUser = updated;
        return updated;
      }
      if (u.id === toId) return { ...u, balance: u.balance + amount };
      return u;
    });
    transactions = [...transactions, {
      id: generateId(),
      fromId,
      toId,
      amount,
      type: 'transfer',
      description: `Перевод от ${from.username} → ${to.username}`,
      createdAt: new Date().toISOString(),
    }];
    notify();
    return { success: true, message: `Переведено ${amount} К пользователю ${to.username}` };
  },

  claimBonus: (userId: string, bonusId: string): { success: boolean; message: string } => {
    const bonus = bonuses.find(b => b.id === bonusId);
    const user = users.find(u => u.id === userId);
    if (!bonus || !user) return { success: false, message: 'Бонус не найден' };
    if (!bonus.isActive) return { success: false, message: 'Бонус неактивен' };
    if (bonus.usedBy.includes(userId)) return { success: false, message: 'Вы уже получили этот бонус' };

    bonuses = bonuses.map(b => b.id === bonusId ? { ...b, usedBy: [...b.usedBy, userId] } : b);
    casinoStore.updateBalance(userId, bonus.amount, 'bonus', `Бонус: ${bonus.title}`);
    return { success: true, message: `+${bonus.amount} К начислено` };
  },

  claimPromo: (userId: string, code: string): { success: boolean; message: string } => {
    const bonus = bonuses.find(b => b.promoCode?.toUpperCase() === code.toUpperCase() && b.type === 'promo');
    if (!bonus) return { success: false, message: 'Промокод не найден' };
    return casinoStore.claimBonus(userId, bonus.id);
  },

  banUser: (userId: string) => {
    users = users.map(u => u.id === userId ? { ...u, isBanned: !u.isBanned } : u);
    notify();
  },

  addAdmin: (userId: string): { success: boolean; message: string } => {
    const user = users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'Пользователь не найден' };
    users = users.map(u => u.id === userId ? { ...u, isAdmin: true } : u);
    notify();
    return { success: true, message: `${user.username} назначен администратором` };
  },

  removeAdmin: (userId: string) => {
    users = users.map(u => u.id === userId ? { ...u, isAdmin: false } : u);
    notify();
  },

  addBonus: (bonus: Omit<Bonus, 'id' | 'usedBy'>) => {
    bonuses = [...bonuses, { ...bonus, id: generateId(), usedBy: [] }];
    notify();
  },

  toggleBonus: (bonusId: string) => {
    bonuses = bonuses.map(b => b.id === bonusId ? { ...b, isActive: !b.isActive } : b);
    notify();
  },

  deleteBonus: (bonusId: string) => {
    bonuses = bonuses.filter(b => b.id !== bonusId);
    notify();
  },

  getStats: () => {
    const totalDeposits = transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
    const totalWins     = transactions.filter(t => t.type === 'win').reduce((s, t) => s + t.amount, 0);
    const totalLosses   = transactions.filter(t => t.type === 'loss').reduce((s, t) => s + t.amount, 0);
    const totalBonuses  = transactions.filter(t => t.type === 'bonus').reduce((s, t) => s + t.amount, 0);
    return {
      totalUsers: users.filter(u => !u.isAdmin).length,
      activeUsers: users.filter(u => !u.isBanned && !u.isAdmin).length,
      totalDeposits,
      totalWins,
      totalLosses,
      revenue: totalLosses - totalWins,
      totalBonuses,
      totalTransactions: transactions.length,
    };
  },
};

// ── React hook ────────────────────────────────────────────────────────────────
export function useCasino() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const unsub = casinoStore.subscribe(() => setTick(n => n + 1));
    return unsub;
  }, []);

  void tick;

  return {
    users: casinoStore.getUsers(),
    transactions: casinoStore.getTransactions(),
    bonuses: casinoStore.getBonuses(),
    currentUser: casinoStore.getCurrentUser(),
    stats: casinoStore.getStats(),
    ...casinoStore,
  };
}
