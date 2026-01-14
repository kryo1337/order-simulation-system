export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export type OrderStatus = 
  | 'created' 
  | 'prepared' 
  | 'shipped' 
  | 'invoiced';

export interface Order {
  id: string;
  products: Product[];
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  status: OrderStatus;
}

export type EventType = 
  | 'OrderCreated' 
  | 'OrderPrepared' 
  | 'OrderShipped' 
  | 'InvoiceSent';

export type ServiceName = 
  | 'generator' 
  | 'prepare' 
  | 'ship' 
  | 'invoice';

export interface OrderEvent {
  eventId: string;
  orderId: string;
  eventType: EventType;
  message: string;
  timestamp: string;
  serviceName: ServiceName;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LogsQueryParams {
  orderId?: string;
  eventType?: EventType;
  serviceName?: ServiceName;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface QueueStats {
  ordersQueue: number;
  preparedQueue: number;
  shippedQueue: number;
}

export interface GeneratorConfig {
  frequency: number;
  isRunning: boolean;
}

export interface QueueMessage<T = Order> {
  body: T;
  messageId: string;
  enqueuedTime?: Date;
}
