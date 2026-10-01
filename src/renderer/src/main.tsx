import { createRoot } from 'react-dom/client'
import App from './App'
import { PlanProvider } from './fmpCaps'
import './styles/app.css'

createRoot(document.getElementById('root')!).render(<PlanProvider><App /></PlanProvider>)
