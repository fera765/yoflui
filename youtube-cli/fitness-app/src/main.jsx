import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Initialize theme before rendering the app
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  
  if (savedTheme) {
    document.body.classList.add(savedTheme)
  } else {
    const initialTheme = systemPrefersDark ? 'dark' : 'light'
    document.body.classList.add(initialTheme)
    localStorage.setItem('theme', initialTheme)
  }
}

initializeTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)