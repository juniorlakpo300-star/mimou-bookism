import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './discover.css'
import './updates.css'

import Home from './pages/Home'
import Choix from './pages/Choix'
import Catalogue from './pages/Catalogue'
import Manga from './pages/Manga'
import Favoris from './pages/Favoris'
import Decouvrir from './pages/Decouvrir'
import Ameliorations from './pages/Ameliorations'
import Dictionnaire from './pages/Dictionnaire'
import Publier from './pages/Publier'
import Reader from './pages/Reader'
import Ecrivain from './pages/Ecrivain'
import Admin from './pages/Admin'

import MimouIA from './components/MimouIA'
import { AuthProvider } from './AuthContext.jsx'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/choix" element={<Choix />} />
          <Route path="/livres" element={<Catalogue />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/mangas" element={<Manga />} />
          <Route path="/favoris" element={<Favoris />} />
          <Route path="/decouvrir" element={<Decouvrir />} />
          <Route path="/ameliorations" element={<Ameliorations />} />
          <Route path="/dictionnaire" element={<Dictionnaire />} />
          <Route path="/publier" element={<Publier />} />
          <Route path="/ecrivain" element={<Ecrivain />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/read/:id" element={<Reader />} />
          <Route path="/lire/:id" element={<Reader />} />
          <Route path="*" element={<div className="state"><h1>404 - Page non trouvée</h1></div>} />
        </Routes>
        <MimouIA />
      </BrowserRouter>
    </AuthProvider>
  )
}
