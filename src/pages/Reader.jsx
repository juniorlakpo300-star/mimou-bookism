import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabase.js'

export default function Lecteur(){
  const {id} = useParams()
  const [book, setBook] = useState(null)
  useEffect(()=>{
    supabase.from('books').select('*').eq('id',id).single().then(({data})=>setBook(data))
  },[id])
  if(!book) return <p>Chargement...</p>
  return(
    <div style={{padding:20}}>
      <h2>{book.title}</h2>
      <iframe src={book.file_url} style={{width:'100%', height:'90vh'}} title="pdf" />
    </div>
  )
}