import { useState } from 'react';
import Navbar from '@/components/Navbar';
import HomePage from '@/pages/HomePage';
import GamesPage from '@/pages/GamesPage';
import BonusesPage from '@/pages/BonusesPage';
import TransferPage from '@/pages/TransferPage';
import AdminPage from '@/pages/AdminPage';

type Page = 'home' | 'games' | 'bonuses' | 'transfer' | 'admin';

const Index = () => {
  const [page, setPage] = useState<Page>('home');

  return (
    <div className="min-h-screen bg-background">
      <Navbar currentPage={page} onNavigate={setPage} />
      <main className="max-w-5xl mx-auto px-4 pt-20 pb-12">
        {page === 'home' && <HomePage onNavigate={setPage} />}
        {page === 'games' && <GamesPage />}
        {page === 'bonuses' && <BonusesPage />}
        {page === 'transfer' && <TransferPage />}
        {page === 'admin' && <AdminPage />}
      </main>
    </div>
  );
};

export default Index;
