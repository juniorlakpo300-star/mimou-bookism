import { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'
import { Link } from 'react-router-dom'

export default function Catalogue(){
  const [books, setBooks] = useState([])
  useEffect(()=>{
    supabase.from('books').select('*').order('created_at',{ascending:false}).then(({data})=>setBooks(data||[]))
  },[])
  return(
    <div style={{padding:20}}>
      <Link to="/publier">+ Publier</Link>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,150px)', gap:15, marginTop:20}}>
        {books.map(b=>(
          <Link key={b.id} to={`/lire/${b.id}`}>
            <img src={b.cover_url} style={{width:'100%', height:200, objectFit:'cover'}} />
            <p>{b.title} - {b.author}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}