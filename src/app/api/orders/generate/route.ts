import { NextResponse } from 'next/server';
import { sendToQueue, QUEUE_NAMES } from '@/lib/azure/service-bus';
import { logEvent } from '@/lib/azure/table-storage';
import { generateRandomOrder, formatCurrency } from '@/lib/utils';
import type { ApiResponse, Order } from '@/lib/types';

export async function POST() {
  try {
    const order = generateRandomOrder();

    await sendToQueue(QUEUE_NAMES.ORDERS, order);

    await logEvent(
      order.id,
      'OrderCreated',
      `Zamówienie #${order.id.slice(0, 8)} utworzone dla ${order.customerName} na kwotę ${formatCurrency(order.totalAmount)}`,
      'generator'
    );

    const response: ApiResponse<Order> = {
      success: true,
      data: order,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error generating order:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate order',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
