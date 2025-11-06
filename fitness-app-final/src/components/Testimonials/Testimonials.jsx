import React from 'react';
import TestimonialCard from '../TestimonialCard/TestimonialCard';

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: "Ana Silva",
      role: "CEO da TechSolutions",
      content: "O produto超transformou nossa maneira de trabalhar. A eficiência aumentou em 200% desde a implementação.",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80"
    },
    {
      id: 2,
      name: "Carlos Mendes",
      role: "Diretor de Inovação na DataCorp",
      content: "A interface intuitiva e os recursos avançados fizeram toda a diferença para nossa equipe de desenvolvimento.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80"
    },
    {
      id: 3,
      name: "Fernanda Costa",
      role: "Gerente de Projetos na CloudFirst",
      content: "A implementação foi surpreendentemente rápida e os resultados foram visíveis desde o primeiro mês.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80"
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
            Depoimentos
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Veja o que nossos clientes dizem sobre nossos produtos e serviços
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <TestimonialCard 
              key={testimonial.id}
              name={testimonial.name}
              role={testimonial.role}
              content={testimonial.content}
              avatar={testimonial.avatar}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;