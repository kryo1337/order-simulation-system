'use client';

import { useEffect, useState } from 'react';

interface Stats {
  ordersQueue: number;
  preparedQueue: number;
  shippedQueue: number;
  eventsLastMinute: number;
  usingMockStorage: boolean;
}

interface StatsPanelProps {
  refreshTrigger?: number;
}

export default function StatsPanel({ refreshTrigger }: StatsPanelProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/queues/stats');
      const data = await response.json();
      if (data.success && data.data) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (refreshTrigger) {
      fetchStats();
    }
  }, [refreshTrigger]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
            <div className="h-8 bg-gray-700 rounded mb-2" />
            <div className="h-4 bg-gray-700 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">
            {stats.ordersQueue}
          </div>
          <div className="text-sm text-gray-400">W kolejce orders</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-400">
            {stats.preparedQueue}
          </div>
          <div className="text-sm text-gray-400">Przygotowane</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">
            {stats.shippedQueue}
          </div>
          <div className="text-sm text-gray-400">Wysłane</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-400">
            {stats.eventsLastMinute}
          </div>
          <div className="text-sm text-gray-400">Zdarzeń/min</div>
        </div>
      </div>

      {stats.usingMockStorage && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
          <p className="text-yellow-300 text-sm">
            Tryb deweloperski - używam lokalnego mock storage zamiast Azure
          </p>
        </div>
      )}
    </div>
  );
}
