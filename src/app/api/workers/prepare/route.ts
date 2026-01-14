import { NextRequest, NextResponse } from 'next/server';
import { receiveFromQueue, sendToQueue, QUEUE_NAMES } from '@/lib/azure/service-bus';
import { logEvent } from '@/lib/azure/table-storage';
import { sleep, randomDelay, formatCurrency } from '@/lib/utils';
import type { ApiResponse, Order } from '@/lib/types';

interface PrepareResult {
  processed: boolean;
  order?: { id: string; customerName: string; processingTime: number };
  queueEmpty: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const simulate = searchParams.get('simulate') !== 'false';

    const received = await receiveFromQueue(QUEUE_NAMES.ORDERS);
    
    if (!received) {
      const response: ApiResponse<PrepareResult> = {
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

    const preparedOrder: Order = {
      ...order,
      status: 'prepared',
    };

    await sendToQueue(QUEUE_NAMES.PREPARED, preparedOrder);

    await logEvent(
      order.id,
      'OrderPrepared',
      `Zamówienie #${order.id.slice(0, 8)} zostało przygotowane do wysyłki (${formatCurrency(order.totalAmount)})`,
      'prepare'
    );

    await complete();

    const response: ApiResponse<PrepareResult> = {
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
    console.error('Error in prepare worker:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process order',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
