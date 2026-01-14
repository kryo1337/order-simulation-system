'use client';

import type { OrderEvent } from '@/lib/types';

interface EventsTableProps {
  events: OrderEvent[];
  isLoading?: boolean;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  OrderCreated: 'bg-blue-600',
  OrderPrepared: 'bg-yellow-600',
  OrderShipped: 'bg-green-600',
  InvoiceSent: 'bg-purple-600',
};

const SERVICE_COLORS: Record<string, string> = {
  generator: 'text-blue-400',
  prepare: 'text-yellow-400',
  ship: 'text-green-400',
  invoice: 'text-purple-400',
};

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(dateString));
}

export default function EventsTable({ events, isLoading }: EventsTableProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-400">Ładowanie zdarzeń...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">Brak zdarzeń do wyświetlenia</p>
        <p className="text-gray-500 text-sm mt-2">
          Użyj generatora aby utworzyć zamówienia
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900 text-left">
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Czas
              </th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Typ
              </th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Wiadomość
              </th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Serwis
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {events.map((event) => (
              <tr
                key={event.eventId}
                className="hover:bg-gray-700/50 transition-colors"
              >
                <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                  {formatDate(event.timestamp)}
                </td>
                <td className="px-4 py-3 text-sm text-white font-mono">
                  {event.orderId.slice(0, 8)}...
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                      EVENT_TYPE_COLORS[event.eventType] || 'bg-gray-600'
                    } text-white`}
                  >
                    {event.eventType}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-300 max-w-md truncate">
                  {event.message}
                </td>
                <td className={`px-4 py-3 text-sm font-medium ${SERVICE_COLORS[event.serviceName] || 'text-gray-400'}`}>
                  {event.serviceName}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
