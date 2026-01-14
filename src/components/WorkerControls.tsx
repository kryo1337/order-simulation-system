'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface WorkerControlsProps {
  onProcessed?: () => void;
}

interface ProcessedOrder {
  id: string;
  customerName: string;
  processingTime: number;
  timestamp: Date;
}

export default function WorkerControls({ onProcessed }: WorkerControlsProps) {
  const [isPolling, setIsPolling] = useState(false);
  const [pollInterval, setPollInterval] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedOrders, setProcessedOrders] = useState<ProcessedOrder[]>([]);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  
  const isProcessingRef = useRef(false);
  const shouldStopRef = useRef(false);

  const processSingleOrder = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(
        `/api/workers/prepare?simulate=true`,
        { method: 'POST' }
      );

      const data = await response.json();

      if (data.success && data.data) {
        if (data.data.processed && data.data.order) {
          const newOrder: ProcessedOrder = {
            ...data.data.order,
            timestamp: new Date(),
          };
          
          setProcessedOrders((prev) => [newOrder, ...prev].slice(0, 10));
          setTotalProcessed((prev) => prev + 1);
          onProcessed?.();
          
          return true;
        } else if (data.data.queueEmpty) {
          return false;
        }
      } else if (data.error) {
        setError(data.error);
        return false;
      }
      
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      return false;
    }
  }, [onProcessed]);

  const handleProcessOne = useCallback(async () => {
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsProcessing(true);
    setError(null);
    setCurrentStatus('Przetwarzanie zamówienia...');

    const hasMore = await processSingleOrder();
    
    if (!hasMore) {
      setCurrentStatus('Kolejka pusta');
    } else {
      setCurrentStatus('Zamówienie przetworzone');
    }

    isProcessingRef.current = false;
    setIsProcessing(false);
  }, [processSingleOrder]);

  const processLoop = useCallback(async () => {
    if (isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    shouldStopRef.current = false;
    setIsProcessing(true);
    setError(null);

    while (!shouldStopRef.current) {
      setCurrentStatus('Przetwarzanie zamówienia...');
      
      const hasMore = await processSingleOrder();
      
      if (!hasMore) {
        setCurrentStatus('Kolejka pusta, czekam...');
        await new Promise(resolve => setTimeout(resolve, pollInterval * 1000));
      }
      
      if (hasMore && !shouldStopRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setCurrentStatus('Zatrzymano');
    isProcessingRef.current = false;
    setIsProcessing(false);
  }, [processSingleOrder, pollInterval]);

  const togglePolling = useCallback(() => {
    if (isPolling) {
      shouldStopRef.current = true;
      setIsPolling(false);
    } else {
      setIsPolling(true);
      processLoop();
    }
  }, [isPolling, processLoop]);

  useEffect(() => {
    return () => {
      shouldStopRef.current = true;
    };
  }, []);

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">
          Worker Przygotowania
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Interwał sprawdzania pustej kolejki: {pollInterval}s
            </label>
            <input
              type="range"
              min="2"
              max="15"
              value={pollInterval}
              onChange={(e) => setPollInterval(parseInt(e.target.value))}
              disabled={isPolling}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>2s</span>
              <span>8s</span>
              <span>15s</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={togglePolling}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                isPolling
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isPolling ? 'Stop' : 'Start Ciągły'}
            </button>

            <button
              onClick={handleProcessOne}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 rounded-lg font-medium bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing && !isPolling ? 'Przetwarzanie...' : 'Przetwórz Jedno'}
            </button>
          </div>

          {currentStatus && (
            <div className="text-sm text-gray-400 text-center">
              {isProcessing && (
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
              )}
              {currentStatus}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-700 pt-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="text-3xl font-bold text-purple-400">
              {totalProcessed}
            </div>
            <div className="text-sm text-gray-400">
              Przetworzonych zamówień
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4">
            <div className={`text-3xl font-bold ${isPolling ? 'text-green-400' : 'text-indigo-400'}`}>
              {isPolling ? 'Aktywny' : 'Zatrzymany'}
            </div>
            <div className="text-sm text-gray-400">
              Status workera
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {processedOrders.length > 0 && (
        <div className="border-t border-gray-700 pt-6">
          <h3 className="text-lg font-medium text-white mb-3">
            Ostatnio przetworzone
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {processedOrders.map((order, index) => (
              <div
                key={`${order.id}-${index}`}
                className="bg-gray-900 rounded-lg p-3 flex justify-between items-center animate-fade-in"
              >
                <div>
                  <span className="text-white font-mono text-sm">
                    {order.id.slice(0, 8)}...
                  </span>
                  <span className="text-gray-400 ml-2 text-sm">
                    {order.customerName}
                  </span>
                </div>
                <span className="text-green-400 text-sm">
                  {order.processingTime.toFixed(1)}s
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
