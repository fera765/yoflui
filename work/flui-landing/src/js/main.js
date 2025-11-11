// Script para funcionalidades interativas da landing page

document.addEventListener('DOMContentLoaded', function() {
    // Animação de scroll suave para links internos
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Efeito de scroll para animar elementos ao entrar na viewport
    const observerOptions = {
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
            }
        });
    }, observerOptions);
    
    // Seleciona elementos para animar
    const animateElements = document.querySelectorAll('.card, .testimonial, .feature-item');
    animateElements.forEach(el => {
        el.classList.add('opacity-0', 'translate-y-10');
        observer.observe(el);
    });
    
    // Função para personalização baseada em interações
    function personalizeExperience() {
        // Detecta o tempo de visita e tipo de dispositivo
        const visitTime = new Date().getHours();
        const isMobile = window.innerWidth < 768;
        
        // Personaliza mensagem baseada no horário
        const heroTitles = document.querySelectorAll('h1');
        heroTitles.forEach(title => {
            if (visitTime >= 5 && visitTime < 12) {
                title.innerHTML = 'Automatize seu Marketing e <span class="text-accent">Dobre</span> sua Conversão - Bom dia!';
            } else if (visitTime >= 12 && visitTime < 18) {
                title.innerHTML = 'Automatize seu Marketing e <span class="text-accent">Dobre</span> sua Conversão - Boa tarde!';
            } else {
                title.innerHTML = 'Automatize seu Marketing e <span class="text-accent">Dobre</span> sua Conversão - Boa noite!';
            }
        });
        
        // Personaliza CTA baseado no dispositivo
        const ctaButtons = document.querySelectorAll('.btn');
        ctaButtons.forEach(button => {
            if (isMobile) {
                button.textContent = 'Comece no Mobile';
            }
        });
    }
    
    // Executa personalização
    personalizeExperience();
    
    // Função para rastrear interações
    function trackInteractions() {
        // Rastreia cliques nos CTAs
        const ctaButtons = document.querySelectorAll('.btn');
        ctaButtons.forEach(button => {
            button.addEventListener('click', function() {
                console.log('CTA Clicado:', this.textContent);
                // Aqui você pode integrar com ferramentas de analytics
            });
        });
        
        // Rastreia scrolls
        let scrollDepth = 0;
        document.addEventListener('scroll', function() {
            const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            if (scrollPercent > scrollDepth && scrollPercent % 25 === 0) {
                scrollDepth = scrollPercent;
                console.log(`Profundidade de scroll: ${scrollPercent}%`);
            }
        });
    }
    
    // Inicia rastreamento de interações
    trackInteractions();
    
    // Função para animação de contadores
    function animateCounters() {
        const counters = document.querySelectorAll('[data-target]');
        const speed = 200;
        
        counters.forEach(counter => {
            const updateCount = () => {
                const target = +counter.getAttribute('data-target');
                const count = +counter.innerText;
                
                const increment = target / speed;
                
                if (count < target) {
                    counter.innerText = Math.ceil(count + increment);
                    setTimeout(updateCount, 1);
                } else {
                    counter.innerText = target;
                }
            };
            
            // Inicia a animação quando o elemento estiver visível
            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        updateCount();
                        obs.disconnect();
                    }
                });
            });
            
            observer.observe(counter);
        });
    }
    
    // Inicia animação de contadores
    animateCounters();
});

// Função para manipulação de formulários
function handleFormSubmission(formId) {
    const form = document.getElementById(formId);
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validação simples
            let isValid = true;
            const inputs = form.querySelectorAll('input[required], textarea[required]');
            
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.classList.add('error');
                } else {
                    input.classList.remove('error');
                }
            });
            
            if (isValid) {
                // Simula envio de formulário
                const submitBtn = form.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                
                submitBtn.textContent = 'Enviando...';
                submitBtn.disabled = true;
                
                // Simula requisição
                setTimeout(() => {
                    alert('Formulário enviado com sucesso!');
                    form.reset();
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }, 1500);
            }
        });
    }
}

// Inicializa manipulação de formulários
document.addEventListener('DOMContentLoaded', function() {
    handleFormSubmission('contact-form');
    handleFormSubmission('newsletter-form');
});