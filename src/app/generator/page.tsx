'use client';

import { useState, useCallback } from 'react';
import GeneratorForm from '@/components/GeneratorForm';
import WorkerControls from '@/components/WorkerControls';
import ShipWorkerControls from '@/components/ShipWorkerControls';
import InvoiceWorkerControls from '@/components/InvoiceWorkerControls';
import StatsPanel from '@/components/StatsPanel';

export default function GeneratorPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Generator Zamówień
        </h1>
        <p className="text-gray-400">
          Symuluj napływ zamówień i przetwarzaj je przez kolejki Azure Service Bus
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-medium text-white mb-4">Statystyki Kolejek</h2>
        <StatsPanel refreshTrigger={refreshTrigger} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GeneratorForm onOrderGenerated={handleRefresh} />
        <WorkerControls onProcessed={handleRefresh} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <ShipWorkerControls onProcessed={handleRefresh} />
        <InvoiceWorkerControls onProcessed={handleRefresh} />
      </div>

      <div className="mt-8 bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-medium text-white mb-4">
          Jak to działa?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                1
              </span>
              <span className="font-medium text-white">Generator</span>
            </div>
            <p className="text-gray-400 pl-10">
              Tworzy losowe zamówienia i wysyła je do kolejki <code className="text-blue-400">orders-queue</code>
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                2
              </span>
              <span className="font-medium text-white">Przygotowanie</span>
            </div>
            <p className="text-gray-400 pl-10">
              Odbiera z <code className="text-blue-400">orders-queue</code>, przetwarza i wysyła do <code className="text-purple-400">prepared-orders-queue</code>
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                3
              </span>
              <span className="font-medium text-white">Wysyłka</span>
            </div>
            <p className="text-gray-400 pl-10">
              Odbiera z <code className="text-purple-400">prepared-orders-queue</code>, wysyła do klienta i do <code className="text-green-400">shipped-orders-queue</code>
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                4
              </span>
              <span className="font-medium text-white">Fakturowanie</span>
            </div>
            <p className="text-gray-400 pl-10">
              Odbiera z <code className="text-green-400">shipped-orders-queue</code>, wystawia i wysyła fakturę do klienta
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold">
                5
              </span>
              <span className="font-medium text-white">Dashboard</span>
            </div>
            <p className="text-gray-400 pl-10">
              Wyświetla wszystkie zdarzenia w czasie rzeczywistym z możliwością filtrowania
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
