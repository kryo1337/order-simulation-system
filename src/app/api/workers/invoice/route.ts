import { NextRequest, NextResponse } from 'next/server';
import { receiveFromQueue, QUEUE_NAMES } from '@/lib/azure/service-bus';
import { logEvent } from '@/lib/azure/table-storage';
import { sleep, randomDelay, formatCurrency } from '@/lib/utils';
import type { ApiResponse } from '@/lib/types';

interface InvoiceResult {
  processed: boolean;
  order?: { id: string; customerName: string; processingTime: number };
  queueEmpty: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const simulate = searchParams.get('simulate') !== 'false';

    const received = await receiveFromQueue(QUEUE_NAMES.SHIPPED);
    
    if (!received) {
      const response: ApiResponse<InvoiceResult> = {
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

    await logEvent(
      order.id,
      'InvoiceSent',
      `Faktura dla zamówienia #${order.id.slice(0, 8)} została wystawiona i wysłana do klienta (${formatCurrency(order.totalAmount)})`,
      'invoice'
    );

    await complete();

    const response: ApiResponse<InvoiceResult> = {
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
    console.error('Error in invoice worker:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create invoice',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
