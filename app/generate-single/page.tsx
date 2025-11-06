"use client";

import { Suspense } from 'react';
import { GenerateSinglePage } from '@/components/GenerateSinglePage';

function GenerateSinglePageWrapper() {
  return <GenerateSinglePage />;
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-champagne via-ivory to-blush">
        <div className="text-center">
          <div className="inline-block mb-4 w-8 h-8 rounded-full border-4 animate-spin border-rose-gold border-t-transparent"></div>
          <p className="text-navy">加载中...</p>
        </div>
      </div>
    }>
      <GenerateSinglePageWrapper />
    </Suspense>
  );
}

