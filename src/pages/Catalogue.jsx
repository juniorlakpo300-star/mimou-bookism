import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase.js'

const FALLBACK_COVER = 'https://placehold.co/400x560/0f172a/94a3b8?text=MIMOU+BOOKISM'
const FAVORITES_KEY = 'mimou_bookism_favorites'
const LAST_READ_KEY = 'mimou_bookism_last_read'

function getFavorites() {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]') } catch { return [] }
}

export default function Catalogue() {
  const [searchParams] = useSearchParams()
  const [books, setBooks] = useState([])
  const [search, setSearch] = useState('')
  const [type, setType] = useState('Tous')
  const [category, setCategory] = useState('Toutes')
  const [favorites, setFavorites] = useState(getFavorites)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchBooks() {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) setError(error.message)
      else setBooks((data || []).filter(book => !String(book.category || '').toLowerCase().startsWith('manga •')))
      setLoading(false)
    }

    fetchBooks()
  }, [])

  useEffect(() => {
    const access = searchParams.get('access')
    if (access === 'free') setType('Gratuit')
    if (access === 'premium') setType('Premium')
  }, [searchParams])

  const displayCategory = book => String(book.category || '')

  const categories = useMemo(() => {
    const values = books.map(book => displayCategory(book)).filter(Boolean)
    return ['Toutes', ...new Set(values)]
  }, [books])

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase()

    return books.filter(book => {
      const accessOk = type === 'Tous' || (type === 'Gratuit' && book.is_free) || (type === 'Premium' && !book.is_free)
      const cat = displayCategory(book)
      const text = [book.title, book.author, book.description, cat].filter(Boolean).join(' ').toLowerCase()

      return accessOk && (!q || text.includes(q)) && (category === 'Toutes' || cat === category)
    })
  }, [books, search, type, category])

  function toggleFavorite(id) {
    const next = favorites.includes(id) ? favorites.filter(item => item !== id) : [...favorites, id]
    setFavorites(next)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
  }

  function rememberRead(book) {
    localStorage.setItem(LAST_READ_KEY, JSON.stringify({ id: book.id, title: book.title, cover_url: book.cover_url, at: Date.now() }))
  }

  if (loading) return <div className="state books-theme">Chargement de la bibliothèque...</div>
  if (error) return <div className="state error books-theme">Erreur : {error}</div>

  return (
    <main className="page books-theme">
      <div className="container">
        <header className="header">
          <Link to="/" className="brand">MIMOU <span>BOOKISM</span></Link>
          <nav className="nav">
            <Link to="/livres" className="btn active">📚 Livres</Link>
            <Link to="/mangas" className="btn">🗯️ Mangas</Link>
            <Link to="/favoris" className="btn">❤️ Ma bibliothèque</Link>
            <Link to="/admin" className="btn">🛠️ Administration</Link>
          </nav>
        </header>

        <section className="hero catalogue-hero">
          <div className="hero-content">
            <p className="eyebrow">BIBLIOTHÈQUE MIMOU BOOKISM</p>
            <h1>Ouvrez une histoire. Entrez dans un autre monde.</h1>
            <p>Romans, contes, poésie, essais et autres œuvres littéraires vous attendent dans un univers pensé comme une bibliothèque vivante.</p>
          </div>
          <div className="hero-card">
            <span>📖</span>
            <strong>{books.length}</strong>
            <small>livre{books.length > 1 ? 's' : ''} disponible{books.length > 1 ? 's' : ''}</small>
          </div>
        </section>

        <section className="filters">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔎 Rechercher un livre, un auteur..." aria-label="Rechercher un livre" />
          <select value={type} onChange={e => { setType(e.target.value); setCategory('Toutes') }}>
            <option value="Tous">📚 Tous les livres</option>
            <option value="Gratuit">🆓 Gratuits</option>
            <option value="Premium">👑 Premium</option>
          </select>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {categories.map(item => <option key={item}>{item}</option>)}
          </select>
        </section>

        <div className="catalogue-heading">
          <div>
            <p className="section-kicker">BIBLIOTHÈQUE</p>
            <h2>Livres disponibles</h2>
          </div>
          <span className="result-count">{filteredBooks.length} résultat{filteredBooks.length > 1 ? 's' : ''}</span>
        </div>

        {filteredBooks.length === 0 ? (
          <div className="empty-card">
            <h2>Aucun livre trouvé</h2>
            <p>Essayez une autre recherche ou une autre catégorie.</p>
          </div>
        ) : (
          <section className="book-grid">
            {filteredBooks.map(book => (
              <article key={book.id} className="book-card enhanced-book-card">
                <Link to={`/read/${book.id}`} className="book-card-link" onClick={() => rememberRead(book)}>
                  <div className="cover-wrap">
                    <img src={book.cover_url || FALLBACK_COVER} alt={`Couverture de ${book.title || 'livre'}`} className="book-cover" onError={e => { e.currentTarget.src = FALLBACK_COVER }} />
                    <span className={`book-status ${book.is_free ? 'free' : 'premium'}`}>{book.is_free ? 'Gratuit' : 'Premium'}</span>
                  </div>
                  <div className="book-info">
                    <span className="badge">📚 LIVRE</span>
                    <h2 className="book-title">{book.title || 'Sans titre'}</h2>
                    <p className="book-author">{book.author || 'Auteur inconnu'}</p>
                    {book.category && <span className="badge">{displayCategory(book)}</span>}
                  </div>
                </Link>
                <button type="button" className={`favorite-btn ${favorites.includes(book.id) ? 'is-favorite' : ''}`} onClick={() => toggleFavorite(book.id)} aria-label={favorites.includes(book.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
                  {favorites.includes(book.id) ? '❤️' : '♡'} {favorites.includes(book.id) ? 'Favori' : 'Ajouter'}
                </button>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
