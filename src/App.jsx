import { BrowserRouter, Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar.jsx"
import Home from "./pages/Home.jsx"
import Catalogue from "./pages/Catalogue.jsx"
import Reader from "./pages/Reader.jsx"
import Publier from "./pages/Publier.jsx"
import Admimou from "./pages/admimou.jsx"

export default function App(){
  return(
    <BrowserRouter>
      <div className="min-h-screen bg-[#020617] text-[#F8FAFC]">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/lire/:id" element={<Reader />} />
          <Route path="/publier" element={<Publier />} />
          <Route path="/admimou" element={<Admimou />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}