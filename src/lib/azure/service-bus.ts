import { 
  ServiceBusClient, 
  ServiceBusReceivedMessage,
  ServiceBusAdministrationClient 
} from '@azure/service-bus';
import type { Order } from '../types';
import { mockServiceBus } from './mock-storage';

const connectionString = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING?.trim() || '';
const useMockEnv = process.env.USE_MOCK_STORAGE === 'true';

function isValidServiceBusConnectionString(cs: string): boolean {
  return cs.length > 0 && cs.includes('Endpoint=sb://') && cs.includes('SharedAccessKey');
}

const useMock = useMockEnv || !isValidServiceBusConnectionString(connectionString);

const ORDERS_QUEUE = process.env.ORDERS_QUEUE_NAME || 'orders-queue';
const PREPARED_QUEUE = process.env.PREPARED_QUEUE_NAME || 'prepared-orders-queue';
const SHIPPED_QUEUE = process.env.SHIPPED_QUEUE_NAME || 'shipped-orders-queue';

let sbClient: ServiceBusClient | null = null;
let adminClient: ServiceBusAdministrationClient | null = null;

if (process.env.NODE_ENV === 'development') {
  console.log('[Service Bus] Configuration:', {
    useMock,
    useMockEnv,
    hasConnectionString: connectionString.length > 0,
    isValidFormat: isValidServiceBusConnectionString(connectionString),
  });
}

function getClient(): ServiceBusClient {
  if (useMock) {
    throw new Error('Cannot get real client when using mock storage');
  }
  
  if (!sbClient) {
    if (!isValidServiceBusConnectionString(connectionString)) {
      throw new Error(
        'Invalid Service Bus connection string. Expected format: Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=...;SharedAccessKey=...\n' +
        'Make sure USE_MOCK_STORAGE=false and connection string has no quotes or line breaks.'
      );
    }
    sbClient = new ServiceBusClient(connectionString);
  }
  return sbClient;
}

function getAdminClient(): ServiceBusAdministrationClient {
  if (useMock) {
    throw new Error('Cannot get admin client when using mock storage');
  }
  
  if (!adminClient) {
    if (!isValidServiceBusConnectionString(connectionString)) {
      throw new Error('Invalid Service Bus connection string');
    }
    adminClient = new ServiceBusAdministrationClient(connectionString);
  }
  return adminClient;
}

export async function sendToQueue(
  queueName: string,
  order: Order
): Promise<void> {
  if (useMock) {
    await mockServiceBus.sendMessage(queueName, order);
    return;
  }

  const client = getClient();
  const sender = client.createSender(queueName);

  try {
    await sender.sendMessages({
      body: order,
      messageId: order.id,
      contentType: 'application/json',
    });
  } finally {
    await sender.close();
  }
}

export async function receiveFromQueue(
  queueName: string
): Promise<{ order: Order; complete: () => Promise<void> } | null> {
  if (useMock) {
    const order = await mockServiceBus.receiveMessage(queueName);
    if (!order) return null;
    return {
      order,
      complete: async () => {},
    };
  }

  const client = getClient();
  const receiver = client.createReceiver(queueName);

  const messages = await receiver.receiveMessages(1, { maxWaitTimeInMs: 5000 });
  
  if (messages.length === 0) {
    await receiver.close();
    return null;
  }

  const message: ServiceBusReceivedMessage = messages[0];
  const order = message.body as Order;

  return {
    order,
    complete: async () => {
      try {
        await receiver.completeMessage(message);
      } finally {
        await receiver.close();
      }
    },
  };
}

export async function getQueueStats(): Promise<{
  ordersQueue: number;
  preparedQueue: number;
  shippedQueue: number;
}> {
  if (useMock) {
    const stats = await mockServiceBus.getQueueStats();
    return {
      ordersQueue: stats[ORDERS_QUEUE] || 0,
      preparedQueue: stats[PREPARED_QUEUE] || 0,
      shippedQueue: stats[SHIPPED_QUEUE] || 0,
    };
  }

  try {
    const admin = getAdminClient();
    
    const [ordersProps, preparedProps, shippedProps] = await Promise.all([
      admin.getQueueRuntimeProperties(ORDERS_QUEUE),
      admin.getQueueRuntimeProperties(PREPARED_QUEUE),
      admin.getQueueRuntimeProperties(SHIPPED_QUEUE),
    ]);

    return {
      ordersQueue: ordersProps.activeMessageCount || 0,
      preparedQueue: preparedProps.activeMessageCount || 0,
      shippedQueue: shippedProps.activeMessageCount || 0,
    };
  } catch (error) {
    console.error('[Service Bus] Failed to get queue stats:', error);
    return {
      ordersQueue: 0,
      preparedQueue: 0,
      shippedQueue: 0,
    };
  }
}

export const QUEUE_NAMES = {
  ORDERS: ORDERS_QUEUE,
  PREPARED: PREPARED_QUEUE,
  SHIPPED: SHIPPED_QUEUE,
} as const;

export function isUsingMock(): boolean {
  return useMock;
}
