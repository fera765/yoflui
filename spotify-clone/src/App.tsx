import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Player from './components/Player';
import { mockData } from './mocks/data';
import './App.css';

// Páginas de exemplo para cada seção
const Dashboard = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
    <p className="text-gray-300">Bem-vindo ao dashboard. Aqui você pode ver as estatísticas e informações gerais.</p>
  </div>
);

const Users = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-white">Usuários</h1>
    <p className="text-gray-300">Total de usuários: {mockData.users.length}</p>
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {mockData.users.map(user => (
        <div key={user.id} className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white">{user.name}</h3>
          <p className="text-gray-400">{user.email}</p>
        </div>
      ))}
    </div>
  </div>
);

const Products = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-white">Produtos</h1>
    <p className="text-gray-300">Total de produtos: {mockData.products.length}</p>
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {mockData.products.map(product => (
        <div key={product.id} className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white">{product.name}</h3>
          <p className="text-gray-400">R$ {product.price.toFixed(2)}</p>
        </div>
      ))}
    </div>
  </div>
);

const Orders = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-white">Pedidos</h1>
    <p className="text-gray-300">Total de pedidos: {mockData.orders.length}</p>
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {mockData.orders.map(order => (
        <div key={order.id} className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white">Pedido #{order.id}</h3>
          <p className="text-gray-400">Total: R$ {order.total.toFixed(2)}</p>
          <p className="text-gray-400">Status: {order.status}</p>
        </div>
      ))}
    </div>
  </div>
);

const Categories = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-white">Categorias</h1>
    <p className="text-gray-300">Total de categorias: {mockData.categories.length}</p>
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {mockData.categories.map(category => (
        <div key={category.id} className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white">{category.name}</h3>
          <p className="text-gray-400">{category.description}</p>
        </div>
      ))}
    </div>
  </div>
);

// Componente que determina o título da página com base na rota
const PageTitle = () => {
  const location = useLocation();
  
  const getTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/users':
        return 'Usuários';
      case '/products':
        return 'Produtos';
      case '/orders':
        return 'Pedidos';
      case '/categories':
        return 'Categorias';
      default:
        return 'Dashboard';
    }
  };
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-white">{getTitle()}</h1>
    </div>
  );
};

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <Router>
      <div className="flex h-screen bg-gray-900 text-white">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            isOpen={isSidebarOpen} 
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
          />
          
          <main className="flex-1 overflow-y-auto bg-gray-900">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/products" element={<Products />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/categories" element={<Categories />} />
            </Routes>
          </main>
          
          <Player />
        </div>
      </div>
    </Router>
  );
}

export default App;