# Order Simulation System

A Next.js application that simulates order processing workflows using Azure Service Bus message queues. Orders flow through multiple stages with dedicated worker services processing each step.

## Order Flow

```
Created → Prepared → Shipped → Invoiced
```

Each stage is processed by a separate worker that:
1. Reads messages from its input queue
2. Simulates processing time
3. Logs the event to Azure Table Storage
4. Forwards the order to the next queue

## Features

- **Order Generator** - Create random orders with products and customer data
- **Worker Services** - Prepare, Ship, and Invoice workers process orders asynchronously
- **Real-time Dashboard** - Monitor order events with filtering and auto-refresh
- **Queue Statistics** - View message counts for each processing stage

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Azure Service Bus & Table Storage

## Environment Variables

| Variable | Description |
|----------|-------------|
| `AZURE_SERVICE_BUS_CONNECTION_STRING` | Azure Service Bus connection string |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Table Storage connection string |
