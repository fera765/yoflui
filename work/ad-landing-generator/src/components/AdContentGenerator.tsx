import React, { useState } from 'react';

interface BriefingData {
  productName: string;
  targetAudience: string;
  valueProposition: string;
  callToAction: string;
  uniqueSellingPoints: string[];
  painPoints: string[];
  benefits: string[];
  brandVoice: 'professional' | 'friendly' | 'funny' | 'authoritative' | 'inspirational';
  contentPurpose: 'ad' | 'landing-page';
}

interface GeneratedContent {
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
  bulletPoints: string[];
  testimonials: string[];
  faqs: { question: string; answer: string }[];
}

const AdContentGenerator: React.FC = () => {
  const [briefing, setBriefing] = useState<BriefingData>({
    productName: '',
    targetAudience: '',
    valueProposition: '',
    callToAction: '',
    uniqueSellingPoints: [''],
    painPoints: [''],
    benefits: [''],
    brandVoice: 'professional',
    contentPurpose: 'ad'
  });

  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBriefing(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (field: keyof BriefingData, index: number, value: string) => {
    setBriefing(prev => {
      const newArray = [...(prev[field] as string[])];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayItem = (field: keyof BriefingData) => {
    setBriefing(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), '']
    }));
  };

  const removeArrayItem = (field: keyof BriefingData, index: number) => {
    setBriefing(prev => {
      const newArray = [...(prev[field] as string[])];
      newArray.splice(index, 1);
      return { ...prev, [field]: newArray };
    });
  };

  const generateContent = () => {
    setIsLoading(true);
    
    // Simular geração de conteúdo (em um ambiente real, isso seria uma API)
    setTimeout(() => {
      const newContent: GeneratedContent = {
        headline: generateHeadline(),
        subheadline: generateSubheadline(),
        body: generateBody(),
        cta: generateCTA(),
        bulletPoints: generateBulletPoints(),
        testimonials: generateTestimonials(),
        faqs: generateFAQs()
      };
      
      setGeneratedContent(newContent);
      setIsLoading(false);
    }, 1500);
  };

  const generateHeadline = (): string => {
    const { productName, valueProposition, brandVoice, contentPurpose } = briefing;
    
    const headlines: Record<string, string[]> = {
      professional: [
        `Descubra como ${productName} pode transformar seu negócio`,
        `A solução definitiva para ${valueProposition}`,
        `${productName}: A inovação que seu negócio precisa`
      ],
      friendly: [
        `Olá! Conheça ${productName} - sua nova melhor amiga(o)!`,
        `Prepare-se para se apaixonar por ${productName}`,
        `Sua vida vai melhorar com ${productName}`
      ],
      funny: [
        `Por que sofrer quando você pode ter ${productName}?`,
        `${productName}: Porque a vida é curta demais para soluções ruins`,
        `Com ${productName}, até seu sogro vai te elogiar`
      ],
      authoritative: [
        `Os especialistas escolhem ${productName}`,
        `${productName}: O padrão da indústria`,
        `Por que os líderes de mercado escolhem ${productName}`
      ],
      inspirational: [
        `Transforme seu potencial com ${productName}`,
        `${productName}: O começo da sua jornada extraordinária`,
        `Realize seu melhor com ${productName}`
      ]
    };
    
    const voiceHeadlines = headlines[brandVoice] || headlines.professional;
    return voiceHeadlines[Math.floor(Math.random() * voiceHeadlines.length)];
  };

  const generateSubheadline = (): string => {
    const { targetAudience, valueProposition } = briefing;
    const subheadlines = [
      `Projetado especificamente para ${targetAudience} como você`,
      `A solução que resolve ${valueProposition} de forma eficaz`,
      `Mais de 10.000 ${targetAudience} já transformaram seus resultados`,
      `A maneira mais inteligente de alcançar ${valueProposition}`
    ];
    
    return subheadlines[Math.floor(Math.random() * subheadlines.length)];
  };

  const generateBody = (): string => {
    const { productName, targetAudience, valueProposition, painPoints, benefits } = briefing;
    
    let body = `Você sabia que ${painPoints[0] || 'muitos profissionais enfrentam desafios diários'}? `;
    body += `Com ${productName}, ${targetAudience} como você podem ${benefits[0] || 'alcançar resultados impressionantes'}. `;
    body += `Nossa proposta de valor é ${valueProposition}, e isso faz toda a diferença.`;
    
    return body;
  };

  const generateCTA = (): string => {
    const { callToAction } = briefing;
    const ctas = [
      callToAction,
      `Comece sua jornada com ${callToAction}`,
      `Experimente ${callToAction} agora`,
      `Garanta seu ${callToAction} hoje`,
      `Acesse ${callToAction} gratuitamente`
    ];
    
    return ctas[Math.floor(Math.random() * ctas.length)];
  };

  const generateBulletPoints = (): string[] => {
    const { uniqueSellingPoints, benefits } = briefing;
    const allPoints = [...uniqueSellingPoints, ...benefits].filter(point => point.trim() !== '');
    
    if (allPoints.length === 0) {
      return [
        'Solução inovadora e eficaz',
        'Fácil de usar e implementar',
        'Resultados comprovados',
        'Suporte especializado'
      ];
    }
    
    return allPoints.slice(0, 4); // Limitar a 4 pontos
  };

  const generateTestimonials = (): string[] => {
    const { targetAudience } = briefing;
    return [
      `"Finalmente encontrei uma solução que realmente funciona! ${targetAudience} como eu vão adorar isso." - Cliente Satisfeito`,
      `"Minha produtividade aumentou em 200% desde que comecei a usar ${briefing.productName}" - Profissional`,
      `"Não posso imaginar minha rotina sem ${briefing.productName} agora" - Usuário Premium`
    ];
  };

  const generateFAQs = (): { question: string; answer: string }[] => {
    return [
      {
        question: `O que torna ${briefing.productName} diferente da concorrência?`,
        answer: `Nossa abordagem única combina tecnologia avançada com experiência do usuário intuitiva, resultando em resultados superiores.`
      },
      {
        question: `Como posso começar a usar ${briefing.productName}?`,
        answer: `É simples! Basta seguir nosso processo de cadastro em 3 passos e começar a usar imediatamente.`
      },
      {
        question: `Existe suporte disponível?`,
        answer: `Sim, oferecemos suporte 24/7 por chat, email e telefone para garantir sua satisfação total.`
      }
    ];
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Gerador de Conteúdo para Anúncios e Landing Pages</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Formulário de Briefing */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Briefing do Conteúdo</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto/Serviço</label>
              <input
                type="text"
                name="productName"
                value={briefing.productName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Plataforma de Gestão"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Público-alvo</label>
              <input
                type="text"
                name="targetAudience"
                value={briefing.targetAudience}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Empreendedores digitais"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proposta de Valor</label>
              <input
                type="text"
                name="valueProposition"
                value={briefing.valueProposition}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Aumentar vendas em 300%"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Call-to-Action</label>
              <input
                type="text"
                name="callToAction"
                value={briefing.callToAction}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Comece Grátis"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tom da Marca</label>
              <select
                name="brandVoice"
                value={briefing.brandVoice}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="professional">Profissional</option>
                <option value="friendly">Amigável</option>
                <option value="funny">Divertido</option>
                <option value="authoritative">Autoritário</option>
                <option value="inspirational">Inspirador</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Conteúdo</label>
              <select
                name="contentPurpose"
                value={briefing.contentPurpose}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ad">Anúncio</option>
                <option value="landing-page">Landing Page</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pontos de Venda Únicos</label>
              {briefing.uniqueSellingPoints.map((point, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => handleArrayChange('uniqueSellingPoints', index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
                    placeholder={`Ponto ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('uniqueSellingPoints', index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remover
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('uniqueSellingPoints')}
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                + Adicionar Ponto
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dor do Cliente</label>
              {briefing.painPoints.map((point, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => handleArrayChange('painPoints', index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
                    placeholder={`Dor ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('painPoints', index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remover
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('painPoints')}
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                + Adicionar Dor
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Benefícios</label>
              {briefing.benefits.map((point, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
                    placeholder={`Benefício ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('benefits', index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remover
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('benefits')}
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                + Adicionar Benefício
              </button>
            </div>
          </div>
          
          <button
            onClick={generateContent}
            disabled={isLoading}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition duration-300 disabled:opacity-50"
          >
            {isLoading ? 'Gerando...' : 'Gerar Conteúdo'}
          </button>
        </div>
        
        {/* Resultado Gerado */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Conteúdo Gerado</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : generatedContent ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-1">Título Principal</h3>
                <p className="text-lg font-bold text-gray-900">{generatedContent.headline}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-1">Subtítulo</h3>
                <p className="text-gray-700">{generatedContent.subheadline}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-1">Texto Principal</h3>
                <p className="text-gray-700">{generatedContent.body}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-1">Call-to-Action</h3>
                <button className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-blue-700 transition duration-300">
                  {generatedContent.cta}
                </button>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-1">Pontos de Venda</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {generatedContent.bulletPoints.map((point, index) => (
                    <li key={index} className="text-gray-700">{point}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-1">Depoimentos</h3>
                <div className="space-y-3">
                  {generatedContent.testimonials.map((testimonial, index) => (
                    <div key={index} className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
                      <p className="text-gray-700 italic">"{testimonial}"</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-1">Perguntas Frequentes</h3>
                <div className="space-y-3">
                  {generatedContent.faqs.map((faq, index) => (
                    <div key={index} className="border-b border-gray-200 pb-3">
                      <h4 className="font-medium text-gray-800">{faq.question}</h4>
                      <p className="text-gray-600 mt-1">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <p>Preencha o briefing e clique em "Gerar Conteúdo" para criar seu anúncio ou landing page.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdContentGenerator;