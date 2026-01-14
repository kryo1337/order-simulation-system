import { v4 as uuidv4 } from 'uuid';
import type { Order, Product } from './types';

const PRODUCT_NAMES = [
  'Laptop Gaming Pro',
  'Wireless Mouse',
  'Mechanical Keyboard',
  'Monitor 27"',
  'USB-C Hub',
  'Webcam HD',
  'Headphones Bluetooth',
  'SSD 1TB',
  'RAM 16GB DDR5',
  'Graphics Card RTX',
  'Power Supply 750W',
  'PC Case ATX',
  'CPU Cooler',
  'Motherboard Z790',
  'Network Card WiFi 6',
];

const CUSTOMER_NAMES = [
  'Jan Kowalski',
  'Anna Nowak',
  'Piotr Wiśniewski',
  'Maria Wójcik',
  'Tomasz Kamiński',
  'Katarzyna Lewandowska',
  'Michał Zieliński',
  'Agnieszka Szymańska',
  'Krzysztof Woźniak',
  'Małgorzata Dąbrowska',
];

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomElement<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

export function generateRandomProduct(): Product {
  return {
    id: uuidv4(),
    name: randomElement(PRODUCT_NAMES),
    price: randomInt(50, 5000),
    quantity: randomInt(1, 3),
  };
}

export function generateRandomOrder(): Order {
  const productCount = randomInt(1, 5);
  const products: Product[] = [];
  
  for (let i = 0; i < productCount; i++) {
    products.push(generateRandomProduct());
  }

  const totalAmount = products.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0
  );

  const customerName = randomElement(CUSTOMER_NAMES);
  const emailName = customerName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(' ', '.');

  return {
    id: uuidv4(),
    products,
    totalAmount,
    customerName,
    customerEmail: `${emailName}@example.com`,
    createdAt: new Date().toISOString(),
    status: 'created',
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(dateString));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomDelay(minSeconds: number, maxSeconds: number): number {
  return randomInt(minSeconds * 1000, maxSeconds * 1000);
}
