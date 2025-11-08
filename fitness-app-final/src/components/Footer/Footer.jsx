import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="mb-6 md:mb-0">
          <h3 className="text-xl font-bold mb-4">FLUI AGI</h3>
          <p className="text-gray-300">
            Criando experiências digitais incríveis com tecnologia de ponta.
          </p>
        </div>
        
        <div>
          <h4 className="text-lg font-semibold mb-4">Links Rápidos</h4>
          <ul className="space-y-2">
            <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Início</a></li>
            <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Recursos</a></li>
            <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Depoimentos</a></li>
            <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Contato</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-lg font-semibold mb-4">Contato</h4>
          <ul className="space-y-2">
            <li className="text-gray-300">contato@fluiagi.com</li>
            <li className="text-gray-300">+55 (11) 99999-9999</li>
            <li className="text-gray-300">São Paulo, SP</li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-lg font-semibold mb-4">Redes Sociais</h4>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Facebook</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Twitter</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
        <p>&copy; 2025 FLUI AGI. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;