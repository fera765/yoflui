import React from 'react';
import FeatureCard from '../FeatureCard/FeatureCard';
import { 
  FaLightbulb, 
  FaRocket, 
  FaMobileAlt, 
  FaChartLine, 
  FaLock, 
  FaCloud 
} from 'react-icons/fa';

const Features = () => {
  const features = [
    {
      icon: <FaLightbulb className="text-3xl text-blue-500" />,
      title: "Smart Solutions",
      description: "Inteligência artificial aplicada para resolver problemas complexos de forma inovadora."
    },
    {
      icon: <FaRocket className="text-3xl text-purple-500" />,
      title: "High Performance",
      description: "Soluções otimizadas para garantir o melhor desempenho em qualquer ambiente."
    },
    {
      icon: <FaMobileAlt className="text-3xl text-green-500" />,
      title: "Mobile First",
      description: "Design responsivo que funciona perfeitamente em qualquer dispositivo."
    },
    {
      icon: <FaChartLine className="text-3xl text-yellow-500" />,
      title: "Analytics",
      description: "Monitoramento e análise de dados em tempo real para tomada de decisão."
    },
    {
      icon: <FaLock className="text-3xl text-red-500" />,
      title: "Security",
      description: "Proteção de dados e segurança como prioridade em todos os nossos produtos."
    },
    {
      icon: <FaCloud className="text-3xl text-indigo-500" />,
      title: "Cloud Ready",
      description: "Infraestrutura escalável e pronta para ambientes cloud."
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Recursos Poderosos
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Descubra as funcionalidades que tornam nossa solução a melhor escolha para o seu negócio
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;