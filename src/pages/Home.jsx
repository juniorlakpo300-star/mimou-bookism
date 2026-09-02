import { useState, useEffect } from "react"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { db } from "../firebase"
import { Link } from "react-router-dom"

export default function Home(){
  const [books, setBooks] = useState([])
  const [search, setSearch] = useState("")
  const [aiQuestion, setAiQuestion] = useState("")
  const [aiAnswer, setAiAnswer] = useState("")
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(()=>{
    async function fetchBooks(){
      const q = query(collection(db, "books"), where("approved","==",true), orderBy("createdAt","desc"))
      const snap = await getDocs(q)
      setBooks(snap.docs.map(d=>({id:d.id, ...d.data()})))
    }
    fetchBooks().catch(async ()=>{
      // fallback si pas d'index
      const snap = await getDocs(collection(db, "books"))
      setBooks(snap.docs.filter(d=>d.data().approved).map(d=>({id:d.id, ...d.data()})))
    })
  },[])

  const filtered = books.filter(b=> 
    b.title?.toLowerCase().includes(search.toLowerCase()) || 
    b.author?.toLowerCase().includes(search.toLowerCase()) ||
    b.category?.toLowerCase().includes(search.toLowerCase())
  )

  async function askAI(){
    if(!aiQuestion) return
    setAiLoading(true)
    setAiAnswer("")
    try{
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_KEY}`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          contents:[{parts:[{text:`Tu es Mimou, l'assistante de la bibliothèque Mimou-Bookisme. Livres disponibles: ${books.map(b=>b.title+' par '+b.author).join(', ')}. Question utilisateur: ${aiQuestion}. Réponds en 3 phrases max, chaleureux, en français.`}]}]
        })
      })
      const data = await res.json()
      setAiAnswer(data.candidates?.[0]?.content?.parts?.[0]?.text || "Désolée, je n'ai pas compris.")
    }catch(e){ setAiAnswer("Erreur IA: "+e.message) }
    setAiLoading(false)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* BARRE DE RECHERCHE */}
      <div className="mb-8">
        <input 
          value={search}
          onChange={e=>setSearch(e.target.value)}
          placeholder="🔍 Rechercher un titre, auteur, catégorie..."
          className="w-full p-4 rounded-full bg-white text-black outline-none text-lg shadow-xl"
        />
      </div>

      {/* IA MIMOUMOU */}
      <div className="mb-10 p-5 rounded-2xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/20">
        <h2 className="font-bold text-xl mb-3">✨ Demande à Mimou IA</h2>
        <div className="flex gap-2">
          <input value={aiQuestion} onChange={e=>setAiQuestion(e.target.value)} placeholder="Ex: Recommande-moi un livre pour Aïcha..." className="flex-1 p-3 rounded-xl bg-black/50 border border-white/10 outline-none" />
          <button onClick={askAI} disabled={aiLoading} className="px-6 py-3 rounded-xl bg-white text-black font-bold">{aiLoading?"...":"Demander"}</button>
        </div>
        {aiAnswer && <p className="mt-4 p-4 rounded-xl bg-black/40 whitespace-pre-wrap">{aiAnswer}</p>}
      </div>

      {/* LISTE LIVRES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filtered.map(book=>(
          <Link key={book.id} to={`/lire/${book.id}`} className="bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:scale-105 transition">
            <img src={book.cover || "https://via.placeholder.com/300x400?text=Livre"} className="w-full h-48 object-cover" />
            <div className="p-3">
              <p className="font-bold truncate">{book.title}</p>
              <p className="text-xs opacity-60">{book.author}</p>
            </div>
          </Link>
        ))}
      </div>
      {filtered.length===0 && <p className="text-center opacity-50 mt-10">Aucun livre trouvé pour "{search}"</p>}
    </div>
  )
}