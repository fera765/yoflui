import React from 'react';
import { ThemeProvider } from './providers/ThemeProvider';
import Header from './components/Header/Header';
import Hero from './components/Hero/Hero';
import Features from './components/Features/Features';
import Testimonials from './components/Testimonials/Testimonials';
import Footer from './components/Footer/Footer';

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <Header />
        <main>
          <Hero />
          <Features />
          <Testimonials />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;