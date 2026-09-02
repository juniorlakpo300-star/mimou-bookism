import { useState } from 'react'
import { supabase } from '../supabase.js'

export default function Publier(){
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [cover, setCover] = useState(null)
  const [pdf, setPdf] = useState(null)
  const [loading, setLoading] = useState(false)

  const publier = async (e)=>{
    e.preventDefault()
    if(!cover ||!pdf) return alert("Ajoute image + PDF")
    setLoading(true)
    try{
      const coverName = Date.now()+'-'+cover.name
      const pdfName = Date.now()+'-'+pdf.name

      let { error } = await supabase.storage.from('covers').upload(coverName, cover)
      if(error) throw error

      let { error: error2 } = await supabase.storage.from('books').upload(pdfName, pdf)
      if(error2) throw error2

      const coverUrl = supabase.storage.from('covers').getPublicUrl(coverName).data.publicUrl
      const pdfUrl = supabase.storage.from('books').getPublicUrl(pdfName).data.publicUrl

      const { error: insertErr } = await supabase.from('books').insert([{ title, author, cover_url: coverUrl, file_url: pdfUrl }])
      if(insertErr) throw insertErr

      alert("✅ Livre publié!")
      window.location.href="/"
    }catch(err){
      alert("Erreur: "+err.message)
      console.log(err)
    }finally{ setLoading(false) }
  }

  return(
    <div style={{padding:20, maxWidth:400}}>
      <h2>Publier un livre</h2>
      <form onSubmit={publier} style={{display:'flex', flexDirection:'column', gap:10}}>
        <input placeholder="Titre" value={title} onChange={e=>setTitle(e.target.value)} required />
        <input placeholder="Auteur" value={author} onChange={e=>setAuthor(e.target.value)} required />
        <label>Cover (image):</label>
        <input type="file" accept="image/*" onChange={e=>setCover(e.target.files[0])} required />
        <label>Fichier PDF:</label>
        <input type="file" accept=".pdf" onChange={e=>setPdf(e.target.files[0])} required />
        <button disabled={loading}>{loading? "Envoi..." : "Publier"}</button>
      </form>
    </div>
  )
}