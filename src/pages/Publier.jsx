import { useState } from 'react'
import { supabase } from '../supabase.js'

export default function Publier(){
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e){
    e.preventDefault()
    setLoading(true)
    try{
      const form = e.target
      const title = form.title.value
      const file = form.cover.files[0]

      if(!file) throw new Error("Choisis une image")

      const fileName = Date.now() + "_" + file.name.replace(/\s/g, "")

      // Upload cover
      const { error: uploadError } = await supabase.storage.from('covers').upload(fileName, file)
      if(uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('covers').getPublicUrl(fileName)

      // Insert book
      const { error: insertError } = await supabase.from('books').insert({
        title: title,
        author: "Mimou",
        cover_url: urlData.publicUrl
      })
      if(insertError) throw insertError

      alert("✅ Livre publié!")
      form.reset()
    } catch(err){
      console.error(err)
      alert("Erreur: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{padding:50, maxWidth:400}}>
      <h1>Publier un livre</h1>
      <input name="title" placeholder="Titre" required style={{width:'100%', padding:10, marginBottom:10}} />
      <input name="cover" type="file" accept="image/*" required style={{marginBottom:20}} />
      <button disabled={loading} style={{padding:'10px 20px'}}>{loading? "Publication..." : "Publier"}</button>
    </form>
  )
}