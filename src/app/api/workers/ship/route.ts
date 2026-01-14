import { NextRequest, NextResponse } from 'next/server';
import { receiveFromQueue, sendToQueue, QUEUE_NAMES } from '@/lib/azure/service-bus';
import { logEvent } from '@/lib/azure/table-storage';
import { sleep, randomDelay, formatCurrency } from '@/lib/utils';
import type { ApiResponse, Order } from '@/lib/types';

interface ShipResult {
  processed: boolean;
  order?: { id: string; customerName: string; processingTime: number };
  queueEmpty: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const simulate = searchParams.get('simulate') !== 'false';

    const received = await receiveFromQueue(QUEUE_NAMES.PREPARED);
    
    if (!received) {
      const response: ApiResponse<ShipResult> = {
        success: true,
        data: {
          processed: false,
          queueEmpty: true,
        },
      };
      return NextResponse.json(response);
    }

    const { order, complete } = received;

    let processingTime = 0;
    if (simulate) {
      processingTime = randomDelay(2, 5);
      await sleep(processingTime);
    }

    const shippedOrder: Order = {
      ...order,
      status: 'shipped',
    };

    await sendToQueue(QUEUE_NAMES.SHIPPED, shippedOrder);

    await logEvent(
      order.id,
      'OrderShipped',
      `Zamówienie #${order.id.slice(0, 8)} zostało wysłane do klienta (${formatCurrency(order.totalAmount)})`,
      'ship'
    );

    await complete();

    const response: ApiResponse<ShipResult> = {
      success: true,
      data: {
        processed: true,
        queueEmpty: false,
        order: {
          id: order.id,
          customerName: order.customerName,
          processingTime: processingTime / 1000,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in ship worker:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to ship order',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
