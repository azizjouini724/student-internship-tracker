import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// C'est tout ! VitePWA s'occupe du Service Worker tout seul grâce à registerType: 'autoUpdate'
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)