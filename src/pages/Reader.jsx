import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { supabase } from "../supabase.js"

export default function Reader(){
  const { id } = useParams()
  const [book, setBook] = useState(null)

  useEffect(()=>{
    async function getBook(){
      const { data } = await supabase.from("books").select("*").eq("id", id).single()
      setBook(data)
    }
    getBook()
  },[id])

  if(!book) return <div className="p-10">Chargement...</div>

  return(
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{book.title} - {book.author}</h1>
      <iframe src={book.book_url} className="w-full h-[80vh] rounded-xl bg-white" />
    </div>
  )
}