// Mock data for the application
import { User, Product, Order, Category } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    avatar: 'https://via.placeholder.com/150',
    createdAt: new Date('2023-01-15'),
    isActive: true,
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    avatar: 'https://via.placeholder.com/150',
    createdAt: new Date('2023-02-20'),
    isActive: true,
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'user',
    avatar: 'https://via.placeholder.com/150',
    createdAt: new Date('2023-03-10'),
    isActive: false,
  },
];

export const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Electronics',
    description: 'Electronic devices and gadgets',
    createdAt: new Date('2023-01-01'),
  },
  {
    id: '2',
    name: 'Clothing',
    description: 'Apparel and fashion items',
    createdAt: new Date('2023-01-01'),
  },
  {
    id: '3',
    name: 'Books',
    description: 'Books and educational materials',
    createdAt: new Date('2023-01-01'),
  },
];

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Smartphone X',
    description: 'Latest model smartphone with advanced features',
    price: 699.99,
    category: mockCategories[0],
    stock: 50,
    images: ['https://via.placeholder.com/300x300'],
    rating: 4.5,
    isFeatured: true,
    createdAt: new Date('2023-02-01'),
  },
  {
    id: '2',
    name: 'Laptop Pro',
    description: 'High-performance laptop for professionals',
    price: 1299.99,
    category: mockCategories[0],
    stock: 25,
    images: ['https://via.placeholder.com/300x300'],
    rating: 4.8,
    isFeatured: true,
    createdAt: new Date('2023-02-05'),
  },
  {
    id: '3',
    name: 'Cotton T-Shirt',
    description: 'Comfortable cotton t-shirt for everyday wear',
    price: 19.99,
    category: mockCategories[1],
    stock: 100,
    images: ['https://via.placeholder.com/300x300'],
    rating: 4.2,
    isFeatured: false,
    createdAt: new Date('2023-02-10'),
  },
  {
    id: '4',
    name: 'JavaScript Guide',
    description: 'Complete guide to modern JavaScript development',
    price: 39.99,
    category: mockCategories[2],
    stock: 75,
    images: ['https://via.placeholder.com/300x300'],
    rating: 4.7,
    isFeatured: true,
    createdAt: new Date('2023-02-15'),
  },
];

export const mockOrders: Order[] = [
  {
    id: '1',
    userId: mockUsers[0].id,
    products: [
      { product: mockProducts[0], quantity: 1 },
      { product: mockProducts[2], quantity: 2 },
    ],
    totalAmount: 739.97,
    status: 'completed',
    createdAt: new Date('2023-03-01'),
    shippingAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
  },
  {
    id: '2',
    userId: mockUsers[1].id,
    products: [
      { product: mockProducts[1], quantity: 1 },
    ],
    totalAmount: 1299.99,
    status: 'pending',
    createdAt: new Date('2023-03-05'),
    shippingAddress: {
      street: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      country: 'USA',
    },
  },
  {
    id: '3',
    userId: mockUsers[0].id,
    products: [
      { product: mockProducts[3], quantity: 3 },
    ],
    totalAmount: 119.97,
    status: 'shipped',
    createdAt: new Date('2023-03-10'),
    shippingAddress: {
      street: '789 Pine Rd',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'USA',
    },
  },
];

// Function to get a random item from an array
export const getRandomItem = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Function to generate a random number within a range
export const getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};