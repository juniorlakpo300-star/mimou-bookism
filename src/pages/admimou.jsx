import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "../firebase"

const CODE_ADMIN = "MIMOU2026"

export default function Admimou(){
  const [books, setBooks] = useState([])
  const [search, setSearch] = useState("")
  const [edit, setEdit] = useState(null)
  const navigate = useNavigate()

  useEffect(()=>{
    if(localStorage.getItem("isAdmin")!== "true"){
      const c = prompt("Code Admin requis:")
      if(c!== CODE_ADMIN){
        alert("Code faux")
        navigate("/")
        return
      }
      localStorage.setItem("isAdmin", "true")
    }
    load()
  },[])

  async function load(){
    const snap = await getDocs(collection(db, "books"))
    const data = snap.docs.map(d=>({id:d.id, ...d.data()})).sort((a,b)=> (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0))
    setBooks(data)
  }

  async function supprimer(id){
    if(!confirm("Supprimer définitivement?")) return
    await deleteDoc(doc(db, "books", id))
    load()
  }

  async function toggleApprove(b){
    await updateDoc(doc(db, "books", b.id), { approved: !b.approved })
    load()
  }

  async function saveEdit(){
    await updateDoc(doc(db, "books", edit.id), { 
      title: edit.title, 
      author: edit.author, 
      category: edit.category 
    })
    setEdit(null)
    load()
  }

  async function deleteAll(){
    if(!confirm("SUPPRIMER TOUS LES LIVRES?")) return
    if(!confirm("Dernière confirmation - TOUT EFFACER?")) return
    for(const b of books){
      await deleteDoc(doc(db, "books", b.id))
    }
    load()
  }

  const filtered = books.filter(b =>
    b.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.author?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 min-h-screen bg-[#020617] text-white">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black">👑 SUPER ADMIN - FIREBASE</h1>
          <p className="opacity-60">{books.length} livres • {books.filter(b=>!b.approved).length} en attente</p>
          <p className="text-green-400 text-sm">Code: {CODE_ADMIN} - protégé</p>
        </div>
        <div className="flex gap-2">
          <button onClick={deleteAll} className="bg-red-900 border border-red-500 px-4 py-2 rounded-lg text-sm">⚠️ Tout supprimer</button>
          <button onClick={()=>{localStorage.removeItem("isAdmin"); navigate("/")}} className="bg-white text-black px-4 py-2 rounded-lg font-bold">Quitter</button>
        </div>
      </div>

      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher..." className="w-full p-4 rounded-xl bg-white/10 border border-white/10 mb-6 outline-none" />

      <div className="grid gap-3">
        {filtered.map(b => (
          <div key={b.id} className="bg-white/[0.07] p-4 rounded-xl border border-white/10 flex justify-between items-center">
            <div className="flex gap-4 items-center">
              {b.cover ? <img src={b.cover} className="w-14 h-20 object-cover rounded" /> : <div className="w-14 h-20 bg-white/10 rounded flex items-center justify-center">📚</div>}
              <div>
                <p className="font-bold text-lg">{b.title}</p>
                <p className="text-sm opacity-70">{b.author} • {b.category || "Sans cat"}</p>
                <p className={`text-xs mt-1 px-2 py-0.5 rounded inline-block ${b.approved? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{b.approved? "✅ PUBLIÉ" : "⏳ EN ATTENTE"}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={()=>toggleApprove(b)} className={`${b.approved? "bg-yellow-500" : "bg-green-500"} text-black px-3 py-2 rounded-lg font-bold text-sm`}>{b.approved? "Désactiver" : "Accepter"}</button>
              <button onClick={()=>setEdit(b)} className="bg-blue-600 px-3 py-2 rounded-lg text-sm">Modifier</button>
              <button onClick={()=>supprimer(b.id)} className="bg-red-600 px-3 py-2 rounded-lg text-sm">Supprimer</button>
            </div>
          </div>
        ))}
      </div>

      {edit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-white/20 p-6 rounded-2xl w-full max-w-md flex flex-col gap-4">
            <h3 className="font-bold text-xl">Modifier</h3>
            <input value={edit.title} onChange={e=>setEdit({...edit, title:e.target.value})} className="p-3 rounded-lg bg-white/10 border border-white/10" placeholder="Titre" />
            <input value={edit.author} onChange={e=>setEdit({...edit, author:e.target.value})} className="p-3 rounded-lg bg-white/10 border border-white/10" placeholder="Auteur" />
            <input value={edit.category || ""} onChange={e=>setEdit({...edit, category:e.target.value})} className="p-3 rounded-lg bg-white/10 border border-white/10" placeholder="Catégorie" />
            <div className="flex gap-2">
              <button onClick={saveEdit} className="flex-1 bg-green-500 text-black p-3 rounded-lg font-bold">Enregistrer</button>
              <button onClick={()=>setEdit(null)} className="flex-1 bg-white/10 p-3 rounded-lg">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}