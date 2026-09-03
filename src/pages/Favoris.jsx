import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase.js'

const FAVORITES_KEY = 'mimou_bookism_favorites'
const FALLBACK_COVER = 'https://placehold.co/400x560/0f172a/94a3b8?text=MIMOU+BOOKISM'

function readFavorites() {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]') } catch { return [] }
}

export default function Favoris() {
  const [favoriteIds, setFavoriteIds] = useState(readFavorites)
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!favoriteIds.length) { setBooks([]); setLoading(false); return }
      const { data } = await supabase.from('books').select('*').in('id', favoriteIds)
      const ordered = favoriteIds.map(id => (data || []).find(book => book.id === id)).filter(Boolean)
      setBooks(ordered)
      setLoading(false)
    }
    load()
  }, [favoriteIds])

  const remove = (id) => {
    const next = favoriteIds.filter(item => item !== id)
    setFavoriteIds(next)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
  }

  const title = useMemo(() => books.length ? `${books.length} œuvre${books.length > 1 ? 's' : ''} sauvegardée${books.length > 1 ? 's' : ''}` : 'Ta bibliothèque personnelle', [books.length])

  return (
    <main className="page books-theme favorites-page">
      <div className="container">
        <header className="header">
          <Link to="/" className="brand">MIMOU <span>BOOKISM</span></Link>
          <nav className="nav">
            <Link to="/livres" className="btn">📚 Livres</Link>
            <Link to="/mangas" className="btn">🗯️ Mangas</Link>
            <Link to="/favoris" className="btn active">❤️ Ma bibliothèque</Link>
            <Link to="/admin" className="btn">🛠️ Administration</Link>
          </nav>
        </header>

        <section className="hero catalogue-hero">
          <div className="hero-content">
            <p className="eyebrow">MA BIBLIOTHÈQUE</p>
            <h1>Les histoires que tu veux retrouver.</h1>
            <p>{title}. Tes favoris sont conservés sur cet appareil, sans création de compte.</p>
          </div>
          <div className="hero-card"><span>❤️</span><strong>{books.length}</strong><small>favori{books.length > 1 ? 's' : ''}</small></div>
        </section>

        {loading ? <div className="empty-card"><p>Chargement de ta bibliothèque...</p></div> : books.length === 0 ? (
          <div className="empty-card">
            <h2>Ta bibliothèque est encore vide</h2>
            <p>Appuie sur ❤️ sur une œuvre pour la retrouver ici.</p>
            <div className="reader-actions" style={{ marginTop: 18 }}>
              <Link to="/livres" className="btn primary">📚 Découvrir les livres</Link>
              <Link to="/mangas" className="btn">🗯️ Découvrir les mangas</Link>
            </div>
          </div>
        ) : (
          <section className="book-grid">
            {books.map(book => {
              const isManga = String(book.category || '').toLowerCase().startsWith('manga •')
              return (
                <article key={book.id} className="book-card favorite-card">
                  <Link to={`/read/${book.id}`} className="favorite-main">
                    <div className="cover-wrap">
                      <img src={book.cover_url || FALLBACK_COVER} alt={`Couverture de ${book.title || 'œuvre'}`} className="book-cover" onError={e => { e.currentTarget.src = FALLBACK_COVER }} />
                      <span className={`book-status ${isManga ? 'premium' : 'free'}`}>{isManga ? 'Manga' : 'Livre'}</span>
                    </div>
                    <div className="book-info">
                      <span className="badge">{isManga ? '🗯️ MANGA' : '📚 LIVRE'}</span>
                      <h2 className="book-title">{book.title || 'Sans titre'}</h2>
                      <p className="book-author">{book.author || 'Auteur inconnu'}</p>
                    </div>
                  </Link>
                  <button type="button" className="favorite-remove" onClick={() => remove(book.id)} aria-label={`Retirer ${book.title} des favoris`}>❤️ Retirer</button>
                </article>
              )
            })}
          </section>
        )}
      </div>
    </main>
  )
}
