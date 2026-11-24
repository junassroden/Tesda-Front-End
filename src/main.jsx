import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/variables.css'
import './styles/globals.css'
import './styles/site.css'
import './styles/portal.css'
import './styles/training.css'
import './styles/requests.css'
import './styles/ledger.css'
import './styles/assistant.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
