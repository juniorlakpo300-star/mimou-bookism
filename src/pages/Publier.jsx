import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase.js'

export default function Publier() {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)

    try {
      const form = event.currentTarget
      const title = form.title.value.trim()
      const cover = form.cover.files[0]

      if (!cover) throw new Error('Choisis une image de couverture.')

      const extension = cover.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(fileName, cover, { upsert: false })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('covers')
        .getPublicUrl(fileName)

      const { error: insertError } = await supabase.from('books').insert({
        title,
        author: 'Mimou',
        cover_url: urlData.publicUrl,
      })

      if (insertError) throw insertError

      alert('✅ Livre publié !')
      form.reset()
    } catch (err) {
      console.error(err)
      alert(`Erreur : ${err.message || 'Une erreur est survenue.'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="form-page">
      <div className="form-card">
        <Link to="/catalogue" className="btn">← Retour au catalogue</Link>

        <h1>Publier un livre</h1>

        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Titre du livre</span>
            <input name="title" placeholder="Ex. Les chemins de la réussite" required />
          </label>

          <label className="field">
            <span>Couverture</span>
            <input name="cover" type="file" accept="image/*" required />
          </label>

          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? 'Publication en cours...' : 'Publier le livre'}
          </button>
        </form>
      </div>
    </main>
  )
}
