import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase.js'

const FALLBACK_COVER = 'https://placehold.co/400x560/0f172a/94a3b8?text=MIMOU+MANGA'
const FAVORITES_KEY = 'mimou_bookism_favorites'
const LAST_READ_KEY = 'mimou_bookism_last_read'
const MANGA_FIELDS = 'id,title,author,category,description,cover_url,file_path,file_url,book_url,is_free,price,created_at'

function getFavorites() {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]') } catch { return [] }
}

export default function Manga() {
  const [mangas, setMangas] = useState([])
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('Tous les genres')
  const [favorites, setFavorites] = useState(getFavorites)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadMangas() {
      const { data, error } = await supabase
        .from('books')
        .select(MANGA_FIELDS)
        .ilike('category', 'Manga •%')
        .order('created_at', { ascending: false })

      if (!active) return
      if (error) setError(error.message)
      else setMangas(data || [])
      setLoading(false)
    }
    loadMangas()
    return () => { active = false }
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

  function toggleFavorite(id) {
    const next = favorites.includes(id) ? favorites.filter(item => item !== id) : [...favorites, id]
    setFavorites(next)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
  }

  function rememberRead(manga) {
    localStorage.setItem(LAST_READ_KEY, JSON.stringify({ id: manga.id, title: manga.title, cover_url: manga.cover_url, at: Date.now() }))
  }

  if (loading) return <div className="state manga-theme">Chargement des mangas...</div>
  if (error) return <div className="state error manga-theme">Erreur : {error}</div>

  return (
    <main className="page manga-theme">
      <div className="container">
        <header className="header">
          <Link to="/" className="brand">MIMOU <span>BOOKISM</span></Link>
          <nav className="nav">
            <Link to="/livres" className="btn">📚 Livres</Link>
            <Link to="/mangas" className="btn active">🗯️ Mangas</Link>
            <Link to="/favoris" className="btn">❤️ Ma bibliothèque</Link>
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
            {filtered.map((manga, index) => (
              <article key={manga.id} className="book-card enhanced-book-card">
                <Link to={`/read/${manga.id}`} className="book-card-link" onClick={() => rememberRead(manga)}>
                  <div className="cover-wrap">
                    <img
                      src={manga.cover_url || FALLBACK_COVER}
                      alt={`Couverture de ${manga.title || 'manga'}`}
                      className="book-cover"
                      loading={index < 4 ? 'eager' : 'lazy'}
                      fetchPriority={index < 2 ? 'high' : 'auto'}
                      decoding="async"
                      onError={e => { e.currentTarget.src = FALLBACK_COVER }}
                    />
                    <span className={`book-status ${manga.is_free ? 'free' : 'premium'}`}>{manga.is_free ? 'Gratuit' : 'Premium'}</span>
                  </div>
                  <div className="book-info">
                    <span className="badge">🗯️ MANGA</span>
                    <h2 className="book-title">{manga.title || 'Sans titre'}</h2>
                    <p className="book-author">{manga.author || 'Mangaka inconnu'}</p>
                    <span className="badge">{String(manga.category || '').replace(/^manga\s*•\s*/i, '')}</span>
                  </div>
                </Link>
                <button type="button" className={`favorite-btn ${favorites.includes(manga.id) ? 'is-favorite' : ''}`} onClick={() => toggleFavorite(manga.id)} aria-label={favorites.includes(manga.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
                  {favorites.includes(manga.id) ? '❤️' : '♡'} {favorites.includes(manga.id) ? 'Favori' : 'Ajouter'}
                </button>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
