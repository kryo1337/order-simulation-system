'use client';

import { useState, useEffect, useCallback } from 'react';
import EventsTable from '@/components/EventsTable';
import FilterPanel, { FilterState } from '@/components/FilterPanel';
import StatsPanel from '@/components/StatsPanel';
import type { OrderEvent } from '@/lib/types';

export default function DashboardPage() {
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    orderId: '',
    eventType: '',
    serviceName: '',
    startDate: '',
    endDate: '',
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(3);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      
      if (filters.orderId) params.set('orderId', filters.orderId);
      if (filters.eventType) params.set('eventType', filters.eventType);
      if (filters.serviceName) params.set('serviceName', filters.serviceName);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      params.set('limit', '100');

      const response = await fetch(`/api/logs?${params.toString()}`);
      const data = await response.json();

      if (data.success && data.data) {
        setEvents(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchEvents();
      setRefreshTrigger((prev) => prev + 1);
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchEvents]);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Dashboard Zdarzeń
          </h1>
          <p className="text-gray-400">
            Monitoruj wszystkie zdarzenia w systemie zamówień w czasie rzeczywistym
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Auto-refresh:</label>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                autoRefresh
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {autoRefresh ? 'ON' : 'OFF'}
            </button>
          </div>

          {autoRefresh && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Co:</label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
              >
                <option value="1">1s</option>
                <option value="3">3s</option>
                <option value="5">5s</option>
                <option value="10">10s</option>
              </select>
            </div>
          )}

          <button
            onClick={fetchEvents}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
          >
            Odśwież
          </button>
        </div>
      </div>

      <div className="mb-8">
        <StatsPanel refreshTrigger={refreshTrigger} />
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-medium text-white mb-4">Filtry</h2>
        <FilterPanel onFilterChange={handleFilterChange} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-white">
            Zdarzenia ({events.length})
          </h2>
          {autoRefresh && (
            <span className="text-sm text-gray-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Auto-refresh aktywny
            </span>
          )}
        </div>
        <EventsTable events={events} isLoading={isLoading} />
      </div>
    </div>
  );
}
