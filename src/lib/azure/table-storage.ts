import { TableClient, TableEntity } from '@azure/data-tables';
import { v4 as uuidv4 } from 'uuid';
import type { OrderEvent, EventType, ServiceName, LogsQueryParams } from '../types';
import { mockTableStorage } from './mock-storage';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING?.trim() || '';
const tableName = process.env.AZURE_STORAGE_TABLE_NAME || 'orderEvents';
const useMockEnv = process.env.USE_MOCK_STORAGE === 'true';

function isValidStorageConnectionString(cs: string): boolean {
  return cs.length > 0 && cs.includes('AccountName=') && cs.includes('AccountKey=');
}

const useMock = useMockEnv || !isValidStorageConnectionString(connectionString);

let tableClient: TableClient | null = null;
let tableInitialized = false;

if (process.env.NODE_ENV === 'development') {
  console.log('[Table Storage] Configuration:', {
    useMock,
    useMockEnv,
    hasConnectionString: connectionString.length > 0,
    isValidFormat: isValidStorageConnectionString(connectionString),
    tableName,
  });
}

function getClient(): TableClient {
  if (useMock) {
    throw new Error('Cannot get real client when using mock storage');
  }
  
  if (!tableClient) {
    if (!isValidStorageConnectionString(connectionString)) {
      throw new Error(
        'Invalid Storage connection string. Expected format: DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net\n' +
        'Make sure USE_MOCK_STORAGE=false and connection string has no quotes or line breaks.'
      );
    }
    tableClient = TableClient.fromConnectionString(connectionString, tableName);
  }
  return tableClient;
}

async function ensureTableExists(): Promise<void> {
  if (useMock || tableInitialized) return;

  const client = getClient();
  try {
    await client.createTable();
    console.log(`[Table Storage] Created table: ${tableName}`);
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode === 409) {
      console.log(`[Table Storage] Table already exists: ${tableName}`);
    } else {
      throw error;
    }
  }
  tableInitialized = true;
}

function toTableEntity(event: OrderEvent): TableEntity {
  return {
    partitionKey: event.orderId,
    rowKey: event.eventId,
    eventType: event.eventType,
    message: event.message,
    timestamp: event.timestamp,
    serviceName: event.serviceName,
  };
}

function fromTableEntity(entity: TableEntity): OrderEvent {
  return {
    eventId: entity.rowKey as string,
    orderId: entity.partitionKey as string,
    eventType: entity.eventType as EventType,
    message: entity.message as string,
    timestamp: entity.timestamp as string,
    serviceName: entity.serviceName as ServiceName,
  };
}

export async function logEvent(
  orderId: string,
  eventType: EventType,
  message: string,
  serviceName: ServiceName
): Promise<OrderEvent> {
  const event: OrderEvent = {
    eventId: uuidv4(),
    orderId,
    eventType,
    message,
    timestamp: new Date().toISOString(),
    serviceName,
  };

  if (useMock) {
    await mockTableStorage.addEvent(event);
    return event;
  }

  await ensureTableExists();
  
  const client = getClient();
  await client.createEntity(toTableEntity(event));
  return event;
}

export async function getEvents(params?: LogsQueryParams): Promise<OrderEvent[]> {
  if (useMock) {
    return mockTableStorage.getEvents({
      orderId: params?.orderId,
      eventType: params?.eventType,
      serviceName: params?.serviceName,
      startDate: params?.startDate,
      endDate: params?.endDate,
      limit: params?.limit,
      offset: params?.offset,
    });
  }

  await ensureTableExists();

  const client = getClient();
  const events: OrderEvent[] = [];

  const filters: string[] = [];
  
  if (params?.orderId) {
    filters.push(`PartitionKey eq '${params.orderId}'`);
  }
  if (params?.eventType) {
    filters.push(`eventType eq '${params.eventType}'`);
  }
  if (params?.serviceName) {
    filters.push(`serviceName eq '${params.serviceName}'`);
  }
  if (params?.startDate) {
    filters.push(`timestamp ge '${params.startDate}'`);
  }
  if (params?.endDate) {
    filters.push(`timestamp le '${params.endDate}'`);
  }

  const filter = filters.length > 0 ? filters.join(' and ') : undefined;
  
  const entities = client.listEntities({
    queryOptions: { filter },
  });

  for await (const entity of entities) {
    if (entity.partitionKey && entity.rowKey) {
      events.push(fromTableEntity(entity as TableEntity));
    }
  }

  events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const offset = params?.offset || 0;
  const limit = params?.limit || 100;
  
  return events.slice(offset, offset + limit);
}

export async function getEventsByOrderId(orderId: string): Promise<OrderEvent[]> {
  return getEvents({ orderId });
}

export async function getRecentEventsCount(minutes: number): Promise<number> {
  if (useMock) {
    return mockTableStorage.getRecentEventsCount(minutes);
  }

  try {
    await ensureTableExists();
    
    const client = getClient();
    const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    
    const entities = client.listEntities();
    let count = 0;
    
    for await (const entity of entities) {
      const timestamp = entity.timestamp as string;
      if (timestamp && timestamp >= cutoff) {
        count++;
      }
    }
    
    return count;
  } catch (error) {
    console.error('[Table Storage] Failed to get recent events count:', error);
    return 0;
  }
}

export function isUsingMock(): boolean {
  return useMock;
}
