import type { Order, OrderEvent } from '../types';

const queues: Record<string, Order[]> = {
  'orders-queue': [],
  'prepared-orders-queue': [],
  'shipped-orders-queue': [],
};

let events: OrderEvent[] = [];

export const mockServiceBus = {
  async sendMessage(queueName: string, order: Order): Promise<void> {
    if (!queues[queueName]) {
      queues[queueName] = [];
    }
    queues[queueName].push(order);
    console.log(`[Mock] Sent message to ${queueName}:`, order.id);
  },

  async receiveMessage(queueName: string): Promise<Order | null> {
    if (!queues[queueName] || queues[queueName].length === 0) {
      return null;
    }
    const order = queues[queueName].shift()!;
    console.log(`[Mock] Received message from ${queueName}:`, order.id);
    return order;
  },

  async peekMessages(queueName: string, count: number = 10): Promise<Order[]> {
    if (!queues[queueName]) {
      return [];
    }
    return queues[queueName].slice(0, count);
  },

  async getQueueLength(queueName: string): Promise<number> {
    return queues[queueName]?.length || 0;
  },

  async getQueueStats(): Promise<Record<string, number>> {
    return {
      'orders-queue': queues['orders-queue']?.length || 0,
      'prepared-orders-queue': queues['prepared-orders-queue']?.length || 0,
      'shipped-orders-queue': queues['shipped-orders-queue']?.length || 0,
    };
  },
};

export const mockTableStorage = {
  async addEvent(event: OrderEvent): Promise<void> {
    events.push(event);
    console.log(`[Mock] Added event:`, event.eventType, event.orderId);
  },

  async getEvents(options?: {
    orderId?: string;
    eventType?: string;
    serviceName?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<OrderEvent[]> {
    let result = [...events];

    if (options?.orderId) {
      result = result.filter((e) => e.orderId === options.orderId);
    }
    if (options?.eventType) {
      result = result.filter((e) => e.eventType === options.eventType);
    }
    if (options?.serviceName) {
      result = result.filter((e) => e.serviceName === options.serviceName);
    }
    if (options?.startDate) {
      const start = new Date(options.startDate);
      result = result.filter((e) => new Date(e.timestamp) >= start);
    }
    if (options?.endDate) {
      const end = new Date(options.endDate);
      result = result.filter((e) => new Date(e.timestamp) <= end);
    }

    result.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const offset = options?.offset || 0;
    const limit = options?.limit || 100;
    result = result.slice(offset, offset + limit);

    return result;
  },

  async getEventCount(): Promise<number> {
    return events.length;
  },

  async getRecentEventsCount(minutes: number): Promise<number> {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return events.filter((e) => new Date(e.timestamp) >= cutoff).length;
  },

  async clearEvents(): Promise<void> {
    events = [];
    console.log('[Mock] Cleared all events');
  },
};

export function resetMockStorage(): void {
  queues['orders-queue'] = [];
  queues['prepared-orders-queue'] = [];
  queues['shipped-orders-queue'] = [];
  events = [];
  console.log('[Mock] Reset all storage');
}
