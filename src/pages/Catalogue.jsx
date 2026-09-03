import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase.js'

const FALLBACK_COVER = 'https://placehold.co/400x560/0f172a/94a3b8?text=MIMOU+BOOKISM'

export default function Catalogue() {
  const [searchParams] = useSearchParams()
  const [books, setBooks] = useState([])
  const [search, setSearch] = useState('')
  const [type, setType] = useState('Tous')
  const [category, setCategory] = useState('Toutes')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchBooks() {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) setError(error.message)
      else setBooks(data || [])
      setLoading(false)
    }

    fetchBooks()
  }, [])

  useEffect(() => {
    const access = searchParams.get('access')
    if (access === 'free') setType('Gratuit')
    if (access === 'premium') setType('Premium')
  }, [searchParams])

  const isManga = book => String(book.category || '').toLowerCase().startsWith('manga •')
  const displayCategory = book => String(book.category || '').replace(/^manga\s*•\s*/i, '')

  const categories = useMemo(() => {
    const values = books
      .map(book => displayCategory(book))
      .filter(Boolean)
    return ['Toutes', ...new Set(values)]
  }, [books])

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase()

    return books.filter(book => {
      const manga = isManga(book)
      const accessOk = type === 'Tous' || (type === 'Manga' && manga) || (type === 'Livres' && !manga) || (type === 'Gratuit' && book.is_free) || (type === 'Premium' && !book.is_free)
      const cat = displayCategory(book)
      const text = [book.title, book.author, book.description, cat].filter(Boolean).join(' ').toLowerCase()

      return accessOk &&
        (!q || text.includes(q)) &&
        (category === 'Toutes' || cat === category)
    })
  }, [books, search, type, category])

  if (loading) return <div className="state">Chargement de la bibliothèque...</div>
  if (error) return <div className="state error">Erreur : {error}</div>

  const mangaCount = books.filter(isManga).length

  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <Link to="/" className="brand">MIMOU <span>BOOKISM</span></Link>
          <nav className="nav">
            <Link to="/catalogue" className="btn active">📚 Catalogue</Link>
            <Link to="/admin" className="btn">🛠️ Administration</Link>
          </nav>
        </header>

        <section className="hero catalogue-hero">
          <div className="hero-content">
            <p className="eyebrow">BIBLIOTHÈQUE NUMÉRIQUE</p>
            <h1>Découvrez votre prochaine lecture.</h1>
            <p>Explorez nos livres et mangas, lisez-les et téléchargez les œuvres disponibles.</p>
          </div>
          <div className="hero-card">
            <span>📚</span>
            <strong>{books.length}</strong>
            <small>{books.length > 1 ? 'œuvres' : 'œuvre'} dans la collection</small>
            <small>🗯️ {mangaCount} manga{mangaCount > 1 ? 's' : ''}</small>
          </div>
        </section>

        <section className="filters">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔎 Rechercher un livre, manga, auteur..." aria-label="Rechercher" />
          <select value={type} onChange={e => { setType(e.target.value); setCategory('Toutes') }}>
            <option value="Tous">📚 Tous</option>
            <option value="Livres">📖 Livres</option>
            <option value="Manga">🗯️ Mangas</option>
            <option value="Gratuit">🆓 Gratuits</option>
            <option value="Premium">👑 Premium</option>
          </select>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {categories.map(item => <option key={item}>{item}</option>)}
          </select>
        </section>

        <div className="catalogue-heading">
          <div>
            <p className="section-kicker">NOTRE COLLECTION</p>
            <h2>{type === 'Manga' ? 'Mangas disponibles' : type === 'Livres' ? 'Livres disponibles' : 'Livres & Mangas'}</h2>
          </div>
          <span className="result-count">{filteredBooks.length} résultat{filteredBooks.length > 1 ? 's' : ''}</span>
        </div>

        {filteredBooks.length === 0 ? (
          <div className="empty-card">
            <h2>Aucune œuvre trouvée</h2>
            <p>Essayez une autre recherche, un autre type ou une autre catégorie.</p>
          </div>
        ) : (
          <section className="book-grid">
            {filteredBooks.map(book => {
              const manga = isManga(book)
              return (
                <Link key={book.id} to={`/read/${book.id}`} className="book-card">
                  <div className="cover-wrap">
                    <img src={book.cover_url || FALLBACK_COVER} alt={`Couverture de ${book.title || 'œuvre'}`} className="book-cover" onError={e => { e.currentTarget.src = FALLBACK_COVER }} />
                    <span className={`book-status ${book.is_free ? 'free' : 'premium'}`}>{book.is_free ? 'Gratuit' : 'Premium'}</span>
                  </div>
                  <div className="book-info">
                    <span className="badge">{manga ? '🗯️ MANGA' : '📚 LIVRE'}</span>
                    <h2 className="book-title">{book.title || 'Sans titre'}</h2>
                    <p className="book-author">{book.author || (manga ? 'Mangaka inconnu' : 'Auteur inconnu')}</p>
                    {book.category && <span className="badge">{displayCategory(book)}</span>}
                  </div>
                </Link>
              )
            })}
          </section>
        )}
      </div>
    </main>
  )
}
