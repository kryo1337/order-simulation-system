import { NextRequest, NextResponse } from 'next/server';
import { getEvents, logEvent } from '@/lib/azure/table-storage';
import type { EventType, ServiceName, ApiResponse, OrderEvent } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params = {
      orderId: searchParams.get('orderId') || undefined,
      eventType: (searchParams.get('eventType') as EventType) || undefined,
      serviceName: (searchParams.get('serviceName') as ServiceName) || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const events = await getEvents(params);

    const response: ApiResponse<OrderEvent[]> = {
      success: true,
      data: events,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching logs:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch logs',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { orderId, eventType, message, serviceName } = body;

    if (!orderId || !eventType || !message || !serviceName) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required fields: orderId, eventType, message, serviceName',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const validEventTypes: EventType[] = ['OrderCreated', 'OrderPrepared', 'OrderShipped', 'InvoiceSent'];
    if (!validEventTypes.includes(eventType)) {
      const response: ApiResponse = {
        success: false,
        error: `Invalid eventType. Must be one of: ${validEventTypes.join(', ')}`,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const validServiceNames: ServiceName[] = ['generator', 'prepare', 'ship', 'invoice'];
    if (!validServiceNames.includes(serviceName)) {
      const response: ApiResponse = {
        success: false,
        error: `Invalid serviceName. Must be one of: ${validServiceNames.join(', ')}`,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const event = await logEvent(orderId, eventType, message, serviceName);

    const response: ApiResponse<OrderEvent> = {
      success: true,
      data: event,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating log:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create log',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
