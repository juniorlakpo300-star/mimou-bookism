import { useState } from 'react'
import { supabase } from '../supabase'

function toBase64(file){
  return new Promise((res)=>{
    const r = new FileReader()
    r.readAsDataURL(file)
    r.onload = () => res(r.result)
  })
}

export default function Publier() {
  const [loading, setLoading] = useState(false)
  const [titre, setTitre] = useState('')
  const [auteur, setAuteur] = useState('')
  const [cover, setCover] = useState(null)
  const [pdf, setPdf] = useState(null)

  const uploadViaServer = async (file, bucket) => {
    const base64 = await toBase64(file)
    const fileName = Date.now() + '-' + file.name.replace(/\s/g,'_')
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, fileBase64: base64, bucket, contentType: file.type })
    })
    const data = await res.json()
    if(!res.ok) throw new Error(data.error)
    return data.url
  }

  const handlePublish = async () => {
    if (!titre ||!cover ||!pdf) return alert('Remplis tout')
    setLoading(true)
    try {
      const coverUrl = await uploadViaServer(cover, 'covers')
      const pdfUrl = await uploadViaServer(pdf, 'books')
      const { error } = await supabase.from('books').insert({
        title: titre, author: auteur,
        cover_url: coverUrl, pdf_url: pdfUrl, category: 'Roman'
      })
      if (error) throw error
      alert('Livre publié avec succès!')
      setTitre(''); setAuteur('')
    } catch (e) {
      alert('Erreur: ' + e.message)
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <div style={{padding:20}}>
      <h2>Publier un livre</h2>
      <input placeholder="Titre" value={titre} onChange={e=>setTitre(e.target.value)} /><br/><br/>
      <input placeholder="Auteur" value={auteur} onChange={e=>setAuteur(e.target.value)} /><br/><br/>
      <label>Couverture</label><br/>
      <input type="file" accept="image/*" onChange={e=>setCover(e.target.files[0])} /><br/><br/>
      <label>PDF</label><br/>
      <input type="file" accept=".pdf" onChange={e=>setPdf(e.target.files[0])} /><br/><br/>
      <button onClick={handlePublish} disabled={loading}>{loading? 'Envoi...' : 'Publier'}</button>
    </div>
  )
}