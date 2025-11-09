// Tipos básicos e interfaces para o projeto

// Interface base para usuários
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Interface para produtos/serviços
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// Interface para pedidos
export interface Order {
  id: string;
  userId: string;
  products: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt?: Date;
}

// Interface para itens de pedido
export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

// Interface para configurações
export interface Settings {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  emailUpdates: boolean;
}

// Tipos para estados de loading
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Interface genérica para resultados de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Interface para paginação
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}