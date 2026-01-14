'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Order } from '@/lib/types';

interface GeneratorFormProps {
  onOrderGenerated?: (order: Order) => void;
}

export default function GeneratorForm({ onOrderGenerated }: GeneratorFormProps) {
  const [frequency, setFrequency] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [totalGenerated, setTotalGenerated] = useState(0);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const generateOrder = useCallback(async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/orders/generate', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success && data.data) {
        setLastOrder(data.data);
        setTotalGenerated((prev) => prev + 1);
        onOrderGenerated?.(data.data);
      } else {
        setError(data.error || 'Failed to generate order');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, onOrderGenerated]);

  const startGeneration = useCallback(() => {
    if (intervalRef.current) return;

    setIsRunning(true);
    const intervalMs = 1000 / frequency;

    generateOrder();

    intervalRef.current = setInterval(() => {
      generateOrder();
    }, intervalMs);
  }, [frequency, generateOrder]);

  const stopGeneration = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      stopGeneration();
      startGeneration();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frequency]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">
          Konfiguracja Generatora
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Częstotliwość: {frequency} zamówień/sek
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={frequency}
              onChange={(e) => setFrequency(parseInt(e.target.value))}
              disabled={isRunning}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1/s</span>
              <span>5/s</span>
              <span>10/s</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={isRunning ? stopGeneration : startGeneration}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                isRunning
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isRunning ? 'Stop' : 'Start'}
            </button>

            <button
              onClick={generateOrder}
              disabled={isRunning || isGenerating}
              className="flex-1 py-3 px-4 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? 'Generowanie...' : 'Wygeneruj Jedno'}
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="text-3xl font-bold text-blue-400">
              {totalGenerated}
            </div>
            <div className="text-sm text-gray-400">
              Wygenerowanych zamówień
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4">
            <div className="text-3xl font-bold text-green-400">
              {isRunning ? 'Aktywny' : 'Zatrzymany'}
            </div>
            <div className="text-sm text-gray-400">
              Status generatora
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {lastOrder && (
        <div className="border-t border-gray-700 pt-6">
          <h3 className="text-lg font-medium text-white mb-3">
            Ostatnie zamówienie
          </h3>
          <div className="bg-gray-900 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">ID:</span>
              <span className="text-white font-mono text-sm">
                {lastOrder.id.slice(0, 8)}...
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Klient:</span>
              <span className="text-white">{lastOrder.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Produkty:</span>
              <span className="text-white">{lastOrder.products.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Kwota:</span>
              <span className="text-green-400 font-medium">
                {formatCurrency(lastOrder.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
