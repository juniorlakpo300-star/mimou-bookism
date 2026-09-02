import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js'

export default function Publier() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    try {
      const form = event.currentTarget
      const title = form.title.value.trim()
      const author = form.author.value.trim() || 'Auteur inconnu'
      const category = form.category.value.trim()
      const description = form.description.value.trim()
      const price = Number(form.price.value || 0)
      const isFree = form.is_free.checked
      const cover = form.cover.files[0]
      const pdf = form.pdf.files[0]

      if (!cover || !pdf) throw new Error('Choisis une couverture et un fichier PDF.')
      if (pdf.type !== 'application/pdf') throw new Error('Le livre doit être un fichier PDF.')

      const id = crypto.randomUUID()
      const coverExt = cover.name.split('.').pop()?.toLowerCase() || 'jpg'
      const coverPath = `${id}.${coverExt}`
      const pdfPath = `${id}.pdf`

      const { error: coverError } = await supabase.storage.from('covers').upload(coverPath, cover)
      if (coverError) throw coverError

      const { error: pdfError } = await supabase.storage.from('books').upload(pdfPath, pdf, { contentType: 'application/pdf' })
      if (pdfError) throw pdfError

      const { data: coverData } = supabase.storage.from('covers').getPublicUrl(coverPath)
      const { data: pdfData } = supabase.storage.from('books').getPublicUrl(pdfPath)

      const { error: insertError } = await supabase.from('books').insert({
        id,
        title,
        author,
        category: category || null,
        description: description || null,
        price: isFree ? 0 : price,
        is_free: isFree,
        cover_url: coverData.publicUrl,
        book_url: pdfData.publicUrl,
        file_url: pdfData.publicUrl,
      })
      if (insertError) throw insertError

      alert('✅ Livre publié avec succès !')
      navigate(`/read/${id}`)
    } catch (err) {
      console.error(err)
      alert(`Erreur : ${err.message || 'Une erreur est survenue.'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="form-page">
      <div className="form-card wide">
        <Link to="/catalogue" className="btn">← Retour au catalogue</Link>
        <h1>Publier un livre</h1>
        <p className="form-intro">Ajoute les informations du livre, sa couverture et son PDF.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="field"><span>Titre *</span><input name="title" placeholder="Titre du livre" required /></label>
            <label className="field"><span>Auteur</span><input name="author" placeholder="Nom de l'auteur" /></label>
          </div>
          <div className="form-row">
            <label className="field"><span>Catégorie</span><input name="category" placeholder="Roman, Éducation, etc." /></label>
            <label className="field"><span>Prix</span><input name="price" type="number" min="0" step="0.01" defaultValue="0" /></label>
          </div>
          <label className="field"><span>Description</span><textarea name="description" rows="4" placeholder="Présente brièvement le livre..." /></label>
          <label className="check-field"><input name="is_free" type="checkbox" defaultChecked /> Livre gratuit</label>
          <label className="field"><span>Couverture *</span><input name="cover" type="file" accept="image/*" required /></label>
          <label className="field"><span>Fichier PDF *</span><input name="pdf" type="file" accept="application/pdf,.pdf" required /></label>
          <button className="btn primary full" type="submit" disabled={loading}>{loading ? 'Publication en cours...' : 'Publier le livre'}</button>
        </form>
      </div>
    </main>
  )
}
