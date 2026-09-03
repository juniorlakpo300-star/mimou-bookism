import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { useAuth } from '../AuthContext.jsx'

const FALLBACK_COVER = 'https://placehold.co/400x560/0f172a/94a3b8?text=MIMOU+BOOKISM'

export default function Catalogue() {
  const { user, signOut } = useAuth()
  const [books, setBooks] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Toutes')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function fetchBooks() {
      const { data, error } = await supabase.from('books').select('*')
      if (error) setError(error.message)
      else setBooks(data || [])
      setLoading(false)
    }
    fetchBooks()
  }, [])

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false)
        return
      }
      const { data } = await supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
      setIsAdmin(Boolean(data))
    }
    checkAdmin()
  }, [user])

  const categories = useMemo(() => ['Toutes', ...new Set(books.map(b => b.category).filter(Boolean))], [books])

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase()
    return books.filter(book => {
      const text = [book.title, book.author, book.description, book.category].filter(Boolean).join(' ').toLowerCase()
      return (!q || text.includes(q)) && (category === 'Toutes' || book.category === category)
    })
  }, [books, search, category])

  async function handleLogout() {
    await signOut()
  }

  if (loading) return <div className="state">Chargement des livres...</div>
  if (error) return <div className="state error">Erreur : {error}</div>

  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <Link to="/" className="brand">MIMOU <span>BOOKISM</span></Link>
          <nav className="nav">
            <Link to="/catalogue" className="btn active">Catalogue</Link>
            {user ? (
              <>
                <Link to="/ecrivain" className="btn">✍️ Espace écrivain</Link>
                {isAdmin && <Link to="/admin" className="btn admin-btn">🛡️ Admin</Link>}
                <span className="user-chip">👤 {user.email}</span>
                <button onClick={handleLogout} className="btn">Déconnexion</button>
              </>
            ) : (
              <>
                <Link to="/connexion" className="btn">Connexion</Link>
                <Link to="/inscription" className="btn primary">Créer un compte</Link>
              </>
            )}
          </nav>
        </header>

        <section className="hero">
          <p className="eyebrow">BIBLIOTHÈQUE NUMÉRIQUE</p>
          <h1>Découvrez votre prochaine lecture.</h1>
          <p>Explorez, lisez et téléchargez vos livres préférés sur MIMOU BOOKISM.</p>
          {user && (
            <div className="hero-actions">
              <Link to="/publier" className="btn primary">+ Publier un livre</Link>
              <Link to="/ecrivain" className="btn">Voir mes publications</Link>
            </div>
          )}
        </section>

        <section className="filters">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un livre, un auteur..." aria-label="Rechercher" />
          <select value={category} onChange={e => setCategory(e.target.value)} aria-label="Filtrer par catégorie">
            {categories.map(item => <option key={item}>{item}</option>)}
          </select>
        </section>

        <div className="catalogue-heading">
          <div>
            <p className="section-kicker">NOTRE COLLECTION</p>
            <h2>Livres disponibles</h2>
          </div>
          <span className="result-count">{filteredBooks.length} livre{filteredBooks.length > 1 ? 's' : ''}</span>
        </div>

        {filteredBooks.length === 0 ? (
          <div className="empty-card">Aucun livre ne correspond à votre recherche.</div>
        ) : (
          <section className="book-grid">
            {filteredBooks.map(book => (
              <Link key={book.id} to={`/read/${book.id}`} className="book-card">
                <div className="cover-wrap">
                  <img src={book.cover_url || FALLBACK_COVER} alt={`Couverture de ${book.title}`} className="book-cover" onError={e => { e.currentTarget.src = FALLBACK_COVER }} />
                  <span className={`book-status ${book.is_free ? 'free' : 'paid'}`}>{book.is_free ? 'Gratuit' : `${book.price || 0} FCFA`}</span>
                </div>
                <div className="book-info">
                  <h2 className="book-title">{book.title || 'Sans titre'}</h2>
                  <p className="book-author">{book.author || 'Auteur inconnu'}</p>
                  {book.category && <span className="badge">{book.category}</span>}
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
