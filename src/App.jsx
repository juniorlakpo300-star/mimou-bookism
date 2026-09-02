import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Publier from './pages/Publier'
import Catalogue from './pages/Catalogue'
import Lecteur from './pages/Lecteur'

function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Catalogue />} />
        <Route path="/catalogue" element={<Catalogue />} />
        <Route path="/publier" element={<Publier />} />
        <Route path="/lire/:id" element={<Lecteur />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App