'use client';

import { useState, useEffect, useCallback } from 'react';
import type { OrderEvent, EventType, ServiceName } from '@/lib/types';

interface FilterPanelProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  orderId: string;
  eventType: EventType | '';
  serviceName: ServiceName | '';
  startDate: string;
  endDate: string;
}

const EVENT_TYPES: EventType[] = ['OrderCreated', 'OrderPrepared', 'OrderShipped', 'InvoiceSent'];
const SERVICE_NAMES: ServiceName[] = ['generator', 'prepare', 'ship', 'invoice'];

export default function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterState>({
    orderId: '',
    eventType: '',
    serviceName: '',
    startDate: '',
    endDate: '',
  });

  const handleChange = (field: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      orderId: '',
      eventType: '',
      serviceName: '',
      startDate: '',
      endDate: '',
    });
  };

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-gray-400 mb-1">Order ID</label>
          <input
            type="text"
            value={filters.orderId}
            onChange={(e) => handleChange('orderId', e.target.value)}
            placeholder="np. a1b2c3d4"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-gray-400 mb-1">Typ zdarzenia</label>
          <select
            value={filters.eventType}
            onChange={(e) => handleChange('eventType', e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Wszystkie</option>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-gray-400 mb-1">Serwis</label>
          <select
            value={filters.serviceName}
            onChange={(e) => handleChange('serviceName', e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Wszystkie</option>
            {SERVICE_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={clearFilters}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
        >
          Wyczyść
        </button>
      </div>
    </div>
  );
}
