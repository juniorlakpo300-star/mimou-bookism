import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase.js'

const FALLBACK_COVER = 'https://placehold.co/400x560/0f172a/94a3b8?text=MIMOU+BOOKISM'

export default function Catalogue() {
  const [books, setBooks] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Toutes')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchBooks() {
      const { data, error } = await supabase.from('books').select('*')
      if (error) setError(error.message)
      else setBooks(data || [])
      setLoading(false)
    }
    fetchBooks()
  }, [])

  const categories = useMemo(() => ['Toutes', ...new Set(books.map(b => b.category).filter(Boolean))], [books])

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase()
    return books.filter(book => {
      const matchesSearch = !q || [book.title, book.author, book.description, book.category].filter(Boolean).join(' ').toLowerCase().includes(q)
      const matchesCategory = category === 'Toutes' || book.category === category
      return matchesSearch && matchesCategory
    })
  }, [books, search, category])

  if (loading) return <div className="state">Chargement des livres...</div>
  if (error) return <div className="state error">Erreur : {error}</div>

  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <Link to="/" className="brand">MIMOU <span>BOOKISM</span></Link>
          <nav className="nav">
            <Link to="/catalogue" className="btn">Catalogue</Link>
            <Link to="/connexion" className="btn">Connexion</Link>
            <Link to="/publier" className="btn primary">+ Publier</Link>
          </nav>
        </header>

        <section className="hero">
          <p className="eyebrow">BIBLIOTHÈQUE NUMÉRIQUE</p>
          <h1>Découvrez votre prochaine lecture.</h1>
          <p>Explorez, lisez et téléchargez vos livres préférés sur MIMOU BOOKISM.</p>
        </section>

        <section className="filters">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un livre, un auteur..." aria-label="Rechercher" />
          <select value={category} onChange={e => setCategory(e.target.value)} aria-label="Filtrer par catégorie">
            {categories.map(item => <option key={item}>{item}</option>)}
          </select>
        </section>

        {filteredBooks.length === 0 ? (
          <div className="state">Aucun livre ne correspond à votre recherche.</div>
        ) : (
          <section className="book-grid">
            {filteredBooks.map(book => (
              <Link key={book.id} to={`/read/${book.id}`} className="book-card">
                <img src={book.cover_url || FALLBACK_COVER} alt={`Couverture de ${book.title}`} className="book-cover" onError={e => { e.currentTarget.src = FALLBACK_COVER }} />
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
