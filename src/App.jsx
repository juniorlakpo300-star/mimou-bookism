import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Catalogue from './pages/Catalogue'
import Publier from './pages/Publier'
import Reader from './pages/Reader'
import Connexion from './pages/Connexion'
import Inscription from './pages/Inscription'
import { AuthProvider } from './AuthContext.jsx'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Catalogue />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/publier" element={<Publier />} />
          <Route path="/read/:id" element={<Reader />} />
          <Route path="/lire/:id" element={<Reader />} />
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="*" element={<div className="state"><h1>404 - Page non trouvée</h1></div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
