import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { useAuth } from '../AuthContext.jsx'

const LITERARY_CATEGORIES = [
  'Roman','Nouvelle','Poésie','Théâtre','Conte','Fable','Mémoires','Autobiographie','Biographie','Essai','Chronique','Correspondance','Journal intime','Littérature jeunesse','Littérature pour adolescents','Littérature africaine','Littérature francophone','Littérature étrangère','Roman historique','Roman policier','Roman d’aventure','Roman fantastique','Roman de science-fiction','Roman de fantasy','Roman romantique','Roman psychologique','Roman philosophique','Roman social','Roman épistolaire','Roman initiatique','Roman autobiographique','Dystopie','Utopie','Thriller','Horreur','Mystère','Aventure','Comédie','Tragédie','Drame','Satire','Épopée','Légende','Mythe','Spiritualité','Philosophie','Développement personnel','Éducation','Histoire','Société','Politique','Économie','Sciences','Art et culture','Religion','Jeunesse','Autre'
]

const MANGA_CATEGORIES = [
  'Shōnen','Shōjo','Seinen','Josei','Kodomo','Isekai','Action','Aventure','Comédie','Drame','Fantastique','Fantasy','Horreur','Mystère','Romance','Science-fiction','Sport','Historique','Arts martiaux','Slice of life','Autre'
]

export default function Publier() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState('livre')
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && !user) navigate('/admin', { replace: true })
  }, [user, authLoading, navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!user) return
    setLoading(true)

    try {
      const form = event.currentTarget
      const title = form.title.value.trim()
      const author = form.author.value.trim() || (type === 'manga' ? 'Mangaka inconnu' : 'Auteur inconnu')
      const category = form.category.value
      const description = form.description.value.trim()
      const volume = form.volume.value.trim()
      const cover = form.cover.files[0]
      const pdf = form.pdf.files[0]

      if (!title) throw new Error(`Indique le titre du ${type === 'manga' ? 'manga' : 'livre'}.`)
      if (!cover || !pdf) throw new Error('Choisis une couverture et un fichier PDF.')
      if (pdf.type !== 'application/pdf' && !pdf.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('Le fichier doit être un PDF.')
      }

      const id = crypto.randomUUID()
      const coverExt = cover.name.split('.').pop()?.toLowerCase() || 'jpg'
      const coverPath = `${id}.${coverExt}`
      const pdfPath = `${id}.pdf`

      const { error: coverError } = await supabase.storage.from('covers').upload(coverPath, cover, { upsert: false })
      if (coverError) throw new Error(`Erreur couverture : ${coverError.message}`)

      const { error: pdfError } = await supabase.storage.from('books').upload(pdfPath, pdf, {
        contentType: 'application/pdf', cacheControl: '3600', upsert: false
      })
      if (pdfError) {
        await supabase.storage.from('covers').remove([coverPath])
        throw new Error(`Erreur PDF : ${pdfError.message}. Vérifie le bucket « books » et ses permissions Supabase.`)
      }

      const { data: coverData } = supabase.storage.from('covers').getPublicUrl(coverPath)

      const finalCategory = type === 'manga' ? `Manga • ${category}` : category
      const finalDescription = volume
        ? `${volume}${description ? `\n\n${description}` : ''}`
        : description

      const { error: insertError } = await supabase.from('books').insert({
        id,
        owner_id: user.id,
        title,
        author,
        category: finalCategory || null,
        description: finalDescription || null,
        price: 0,
        is_free: true,
        cover_url: coverData.publicUrl,
        file_path: pdfPath
      })

      if (insertError) {
        await supabase.storage.from('books').remove([pdfPath])
        await supabase.storage.from('covers').remove([coverPath])
        throw new Error(`${type === 'manga' ? 'Manga' : 'Livre'} non enregistré : ${insertError.message}`)
      }

      alert(`✅ ${type === 'manga' ? 'Manga' : 'Livre'} publié avec succès !`)
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

  const categories = type === 'manga' ? MANGA_CATEGORIES : LITERARY_CATEGORIES

  return (
    <main className="form-page">
      <div className="form-card wide">
        <div className="page-topline">
          <Link to="/admin" className="btn">← Administration</Link>
          <Link to="/catalogue" className="btn secondary">Catalogue</Link>
        </div>

        <h1>Publier sur MIMOU BOOKISM</h1>
        <p className="form-intro">Ajoute tes livres ou tes mangas dans la bibliothèque.</p>

        <div className="type-switch" style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <button type="button" className={`btn ${type === 'livre' ? 'primary' : ''}`} onClick={() => setType('livre')}>📚 Livre</button>
          <button type="button" className={`btn ${type === 'manga' ? 'primary' : ''}`} onClick={() => setType('manga')}>🗯️ Manga</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="field"><span>Titre *</span><input name="title" placeholder={type === 'manga' ? 'Titre du manga' : 'Titre du livre'} required /></label>
            <label className="field"><span>{type === 'manga' ? 'Mangaka / auteur' : 'Auteur'}</span><input name="author" placeholder={type === 'manga' ? 'Nom du mangaka' : "Nom de l'auteur"} /></label>
          </div>

          <label className="field"><span>Catégorie *</span><select name="category" defaultValue="" required><option value="" disabled>Choisir un genre</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select></label>

          {type === 'manga' && (
            <label className="field"><span>Tome / chapitre</span><input name="volume" placeholder="Ex. Tome 1, Chapitre 12" /></label>
          )}

          <label className="field"><span>Description</span><textarea name="description" rows="4" placeholder={type === 'manga' ? 'Présente brièvement le manga...' : 'Présente brièvement le livre...'} /></label>
          <label className="field"><span>Couverture *</span><input name="cover" type="file" accept="image/*" required /></label>
          <label className="field"><span>Fichier PDF *</span><input name="pdf" type="file" accept="application/pdf,.pdf" required /></label>

          <button className="btn primary full" type="submit" disabled={loading}>{loading ? 'Publication en cours...' : `Publier le ${type === 'manga' ? 'manga' : 'livre'}`}</button>
        </form>
      </div>
    </main>
  )
}
