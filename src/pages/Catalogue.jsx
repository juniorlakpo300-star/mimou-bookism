import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase.js'

const FALLBACK_COVER = 'https://placehold.co/400x560/0f172a/94a3b8?text=MIMOU+BOOKISM'

export default function Catalogue() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchBooks() {
      try {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setBooks(data || [])
      } catch (err) {
        console.error(err)
        setError(err.message || 'Impossible de charger les livres.')
      } finally {
        setLoading(false)
      }
    }

    fetchBooks()
  }, [])

  if (loading) {
    return <div className="state">Chargement des livres...</div>
  }

  if (error) {
    return <div className="state error">Erreur : {error}</div>
  }

  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <Link to="/" className="brand">
            MIMOU <span>BOOKISM</span>
          </Link>

          <nav className="nav">
            <Link to="/catalogue" className="btn">Catalogue</Link>
            <Link to="/publier" className="btn primary">+ Publier</Link>
          </nav>
        </header>

        <section className="hero">
          <h1>Découvrez votre prochaine lecture.</h1>
          <p>Explorez les livres disponibles sur MIMOU BOOKISM.</p>
        </section>

        {books.length === 0 ? (
          <div className="state">Aucun livre publié pour le moment.</div>
        ) : (
          <section className="book-grid">
            {books.map((book) => (
              <Link key={book.id} to={`/read/${book.id}`} className="book-card">
                <img
                  src={book.cover_url || FALLBACK_COVER}
                  alt={`Couverture de ${book.title}`}
                  className="book-cover"
                  onError={(event) => {
                    event.currentTarget.src = FALLBACK_COVER
                  }}
                />
                <div className="book-info">
                  <h2 className="book-title">{book.title || 'Sans titre'}</h2>
                  <p className="book-author">{book.author || 'Auteur inconnu'}</p>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
