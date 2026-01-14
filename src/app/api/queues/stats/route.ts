import { NextResponse } from 'next/server';
import { getQueueStats, isUsingMock } from '@/lib/azure/service-bus';
import { getRecentEventsCount, isUsingMock as isStorageMock } from '@/lib/azure/table-storage';
import type { ApiResponse, QueueStats } from '@/lib/types';

interface Stats extends QueueStats {
  eventsLastMinute: number;
  usingMockStorage: boolean;
}

export async function GET() {
  try {
    const queueStats = await getQueueStats();
    const eventsLastMinute = await getRecentEventsCount(1);

    const stats: Stats = {
      ...queueStats,
      eventsLastMinute,
      usingMockStorage: isUsingMock() || isStorageMock(),
    };

    const response: ApiResponse<Stats> = {
      success: true,
      data: stats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching stats:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stats',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
