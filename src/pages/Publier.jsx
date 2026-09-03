import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { useAuth } from '../AuthContext.jsx'

const LITERARY_CATEGORIES = [
  'Roman','Nouvelle','Poésie','Théâtre','Conte','Fable','Mémoires','Autobiographie','Biographie','Essai','Chronique','Correspondance','Journal intime','Littérature jeunesse','Littérature pour adolescents','Littérature africaine','Littérature francophone','Littérature étrangère','Roman historique','Roman policier','Roman d’aventure','Roman fantastique','Roman de science-fiction','Roman de fantasy','Roman romantique','Roman psychologique','Roman philosophique','Roman social','Roman épistolaire','Roman initiatique','Roman autobiographique','Dystopie','Utopie','Thriller','Horreur','Mystère','Aventure','Comédie','Tragédie','Drame','Satire','Épopée','Légende','Mythe','Spiritualité','Philosophie','Développement personnel','Éducation','Histoire','Société','Politique','Économie','Sciences','Art et culture','Religion','Jeunesse','Autre'
]

export default function Publier() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && !user) navigate('/connexion', { replace: true })
  }, [user, authLoading, navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!user) return
    setLoading(true)

    try {
      const form = event.currentTarget
      const title = form.title.value.trim()
      const author = form.author.value.trim() || 'Auteur inconnu'
      const category = form.category.value
      const description = form.description.value.trim()
      const cover = form.cover.files[0]
      const pdf = form.pdf.files[0]

      if (!title) throw new Error('Indique le titre du livre.')
      if (!cover || !pdf) throw new Error('Choisis une couverture et un fichier PDF.')
      if (pdf.type !== 'application/pdf') throw new Error('Le livre doit être un fichier PDF.')

      const id = crypto.randomUUID()
      const coverExt = cover.name.split('.').pop()?.toLowerCase() || 'jpg'
      const coverPath = `${id}.${coverExt}`
      const pdfPath = `${id}.pdf`

      const { error: coverError } = await supabase.storage
        .from('covers')
        .upload(coverPath, cover, { upsert: false })
      if (coverError) throw coverError

      const { error: pdfError } = await supabase.storage
        .from('books')
        .upload(pdfPath, pdf, {
          contentType: 'application/pdf',
          upsert: false
        })
      if (pdfError) throw pdfError

      const { data: coverData } = supabase.storage.from('covers').getPublicUrl(coverPath)
      const { data: pdfData } = supabase.storage.from('books').getPublicUrl(pdfPath)

      if (!pdfData?.publicUrl) {
        throw new Error('Impossible de créer le lien public du PDF. Vérifie que le bucket « books » est public dans Supabase.')
      }

      const { error: insertError } = await supabase.from('books').insert({
        id,
        owner_id: user.id,
        title,
        author,
        category: category || null,
        description: description || null,
        price: 0,
        is_free: true,
        cover_url: coverData.publicUrl,
        book_url: pdfData.publicUrl,
        file_url: pdfData.publicUrl
      })

      if (insertError) throw insertError

      alert('✅ Livre gratuit publié avec succès !')
      navigate(`/read/${id}`)
    } catch (err) {
      console.error(err)
      alert(`Erreur : ${err.message || 'Une erreur est survenue.'}`)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) return <div className="state">Vérification du compte...</div>
  if (!user) return null

  return (
    <main className="form-page">
      <div className="form-card wide">
        <div className="page-topline">
          <Link to="/catalogue" className="btn">← Catalogue</Link>
          <Link to="/ecrivain" className="btn secondary">Mes publications</Link>
        </div>

        <h1>Publier un livre</h1>
        <p className="form-intro">Partage gratuitement ton œuvre avec les lecteurs de MIMOU BOOKISM.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="field">
              <span>Titre *</span>
              <input name="title" placeholder="Titre du livre" required />
            </label>
            <label className="field">
              <span>Auteur</span>
              <input name="author" placeholder="Nom de l'auteur" />
            </label>
          </div>

          <label className="field">
            <span>Catégorie *</span>
            <select name="category" defaultValue="" required>
              <option value="" disabled>Choisir un genre littéraire</option>
              {LITERARY_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Description</span>
            <textarea name="description" rows="4" placeholder="Présente brièvement le livre..." />
          </label>

          <label className="field">
            <span>Couverture *</span>
            <input name="cover" type="file" accept="image/*" required />
          </label>

          <label className="field">
            <span>Fichier PDF *</span>
            <input name="pdf" type="file" accept="application/pdf,.pdf" required />
          </label>

          <button className="btn primary full" type="submit" disabled={loading}>
            {loading ? 'Publication en cours...' : 'Publier gratuitement'}
          </button>
        </form>
      </div>
    </main>
  )
}
