'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CalculatorsSection from '@/components/CalculatorsSection';

export default function CalculatorsListPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-base" style={{ paddingTop: '100px', paddingBottom: '80px' }}>
        <CalculatorsSection />
      </main>
      <Footer />
    </>
  );
}
