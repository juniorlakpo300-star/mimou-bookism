import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Catalogue from './pages/Catalogue'
import Publier from './pages/Publier'
import Reader from './pages/Reader'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Catalogue />} />
        <Route path="/catalogue" element={<Catalogue />} />
        <Route path="/publier" element={<Publier />} />
        <Route path="/lire/:id" element={<Reader />} />
        <Route path="/read/:id" element={<Reader />} />
        <Route
          path="*"
          element={
            <div style={{ padding: 50 }}>
              <h1>404 - Page non trouvée</h1>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}