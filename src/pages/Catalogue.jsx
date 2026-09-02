import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../supabase.js"

export default function Catalogue(){
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    async function getBooks(){
      const { data } = await supabase.from("books").select("*").order("created_at", {ascending: false})
      setBooks(data || [])
      setLoading(false)
    }
    getBooks()
  },[])

  if(loading) return <div className="p-10 text-center">Chargement...</div>

  return(
    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
      {books.map(b=>(
        <Link to={`/lire/${b.id}`} key={b.id} className="bg-slate-900 p-3 rounded-xl">
          <img src={b.cover_url} className="h-60 w-full object-cover rounded-lg mb-3" />
          <h3 className="font-bold">{b.title}</h3>
          <p className="text-sm opacity-60">{b.author} • {b.category}</p>
        </Link>
      ))}
    </div>
  )
}