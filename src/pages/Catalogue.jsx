import { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'
import { Link } from 'react-router-dom'

export default function Catalogue(){
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(()=>{
    const fetchBooks = async () => {
      const { data, error } = await supabase.from('books').select('*').order('created_at', {ascending:false})
      if(error){
        console.error(error)
        setError(error.message)
      } else {
        setBooks(data || [])
      }
      setLoading(false)
    }
    fetchBooks()
  },[])

  if(loading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Chargement des livres...</div>
  if(error) return <div className="min-h-screen bg-slate-950 text-red-400 flex items-center justify-center">Erreur: {error}</div>

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Catalogue MIMOU BOOKISM</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
        {books.map(b=>(
          <Link key={b.id} to={`/read/${b.id}`} className="bg-slate-900 rounded-xl overflow-hidden hover:scale-105 transition">
            <img
              src={b.cover_url || '/default-book.jpg'}
              alt={b.title}
              className="w-full h-64 object-cover"
              onError={(e)=> e.target.src='https://via.placeholder.com/200x300?text=No+Cover'}
            />
            <div className="p-4">
              <h3 className="font-bold truncate">{b.title}</h3>
              <p className="text-sm text-slate-400">{b.author || 'Mimou'}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}