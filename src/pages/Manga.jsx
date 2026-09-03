import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase.js'

const FALLBACK_COVER = 'https://placehold.co/400x560/0f172a/94a3b8?text=MIMOU+MANGA'

export default function Manga() {
  const [mangas, setMangas] = useState([])
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('Tous les genres')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadMangas() {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .ilike('category', 'Manga •%')
        .order('created_at', { ascending: false })

      if (error) setError(error.message)
      else setMangas(data || [])
      setLoading(false)
    }
    loadMangas()
  }, [])

  const genres = useMemo(() => {
    const values = mangas.map(manga => String(manga.category || '').replace(/^manga\s*•\s*/i, '')).filter(Boolean)
    return ['Tous les genres', ...new Set(values)]
  }, [mangas])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return mangas.filter(manga => {
      const g = String(manga.category || '').replace(/^manga\s*•\s*/i, '')
      const text = [manga.title, manga.author, manga.description, g].filter(Boolean).join(' ').toLowerCase()
      return (!q || text.includes(q)) && (genre === 'Tous les genres' || g === genre)
    })
  }, [mangas, search, genre])

  if (loading) return <div className="state">Chargement des mangas...</div>
  if (error) return <div className="state error">Erreur : {error}</div>

  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <Link to="/" className="brand">MIMOU <span>BOOKISM</span></Link>
          <nav className="nav">
            <Link to="/livres" className="btn">📚 Livres</Link>
            <Link to="/mangas" className="btn active">🗯️ Mangas</Link>
            <Link to="/admin" className="btn">🛠️ Administration</Link>
          </nav>
        </header>

        <section className="hero catalogue-hero">
          <div className="hero-content">
            <p className="eyebrow">MANGATHÈQUE MIMOU BOOKISM</p>
            <h1>Découvrez vos mangas préférés.</h1>
            <p>Explorez les mangas disponibles, choisissez un titre et plongez directement dans sa lecture.</p>
          </div>
          <div className="hero-card">
            <span>🗯️</span>
            <strong>{mangas.length}</strong>
            <small>manga{mangas.length > 1 ? 's' : ''} disponible{mangas.length > 1 ? 's' : ''}</small>
          </div>
        </section>

        <section className="filters">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔎 Rechercher un manga, un mangaka..." aria-label="Rechercher un manga" />
          <select value={genre} onChange={e => setGenre(e.target.value)}>
            {genres.map(item => <option key={item}>{item}</option>)}
          </select>
        </section>

        <div className="catalogue-heading">
          <div>
            <p className="section-kicker">MANGATHÈQUE</p>
            <h2>Mangas disponibles</h2>
          </div>
          <span className="result-count">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-card">
            <h2>Aucun manga trouvé</h2>
            <p>Les mangas publiés par l'administrateur apparaîtront ici.</p>
          </div>
        ) : (
          <section className="book-grid">
            {filtered.map(manga => (
              <Link key={manga.id} to={`/read/${manga.id}`} className="book-card">
                <div className="cover-wrap">
                  <img src={manga.cover_url || FALLBACK_COVER} alt={`Couverture de ${manga.title || 'manga'}`} className="book-cover" onError={e => { e.currentTarget.src = FALLBACK_COVER }} />
                  <span className={`book-status ${manga.is_free ? 'free' : 'premium'}`}>{manga.is_free ? 'Gratuit' : 'Premium'}</span>
                </div>
                <div className="book-info">
                  <span className="badge">🗯️ MANGA</span>
                  <h2 className="book-title">{manga.title || 'Sans titre'}</h2>
                  <p className="book-author">{manga.author || 'Mangaka inconnu'}</p>
                  <span className="badge">{String(manga.category || '').replace(/^manga\s*•\s*/i, '')}</span>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
