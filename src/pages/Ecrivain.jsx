import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { useAuth } from '../AuthContext.jsx'

const FALLBACK_COVER = 'https://placehold.co/400x560/0f172a/94a3b8?text=MIMOU+BOOKISM'

export default function Ecrivain() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) navigate('/connexion', { replace: true })
  }, [authLoading, user, navigate])

  useEffect(() => {
    if (!user) return

    async function loadBooks() {
      setLoading(true)
      setError('')

      const { data, error: queryError } = await supabase
        .from('books')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (queryError) setError(queryError.message)
      else setBooks(data || [])

      setLoading(false)
    }

    loadBooks()
  }, [user])

  function getStoragePath(url, bucket) {
    if (!url) return null
    const marker = `/storage/v1/object/public/${bucket}/`
    const index = url.indexOf(marker)
    if (index === -1) return null
    return decodeURIComponent(url.slice(index + marker.length).split('?')[0])
  }

  async function deleteBook(book) {
    const confirmed = window.confirm(
      `Supprimer « ${book.title || 'ce livre'} » ?\n\nCette action est définitive.`
    )

    if (!confirmed) return

    setDeleting(book.id)
    setError('')

    try {
      const coverPath = getStoragePath(book.cover_url, 'covers')
      const filePath = getStoragePath(book.file_url || book.book_url, 'books')

      if (coverPath) {
        const { error } = await supabase.storage.from('covers').remove([coverPath])
        if (error) console.warn('Image non supprimée :', error.message)
      }

      if (filePath) {
        const { error } = await supabase.storage.from('books').remove([filePath])
        if (error) console.warn('PDF non supprimé :', error.message)
      }

      const { error: deleteError } = await supabase
        .from('books')
        .delete()
        .eq('id', book.id)
        .eq('owner_id', user.id)

      if (deleteError) throw deleteError

      setBooks(current => current.filter(item => item.id !== book.id))
    } catch (err) {
      setError(err.message || 'Impossible de supprimer le livre.')
    } finally {
      setDeleting(null)
    }
  }

  if (authLoading || loading) {
    return <div className="state">Chargement de votre espace écrivain...</div>
  }

  if (!user) return null

  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <Link to="/catalogue" className="brand">MIMOU <span>BOOKISM</span></Link>

          <nav className="nav">
            <Link to="/catalogue" className="btn">Catalogue</Link>
            <Link to="/publier" className="btn primary">+ Publier</Link>
          </nav>
        </header>

        <section className="dashboard-hero">
          <div>
            <p className="eyebrow">ESPACE ÉCRIVAIN</p>
            <h1>Mes publications</h1>
            <p>Retrouvez ici uniquement les livres publiés avec votre compte.</p>
          </div>
          <div className="writer-stat">
            <strong>{books.length}</strong>
            <span>publication{books.length > 1 ? 's' : ''}</span>
          </div>
        </section>

        {error && <div className="notice error-box">{error}</div>}

        {books.length === 0 ? (
          <div className="empty-card">
            <div className="empty-icon">📚</div>
            <h2>Aucune publication trouvée</h2>
            <p>Les livres que vous publierez avec ce compte apparaîtront ici.</p>
            <Link to="/publier" className="btn primary">Publier mon premier livre</Link>
          </div>
        ) : (
          <section className="writer-grid">
            {books.map(book => (
              <article className="writer-card" key={book.id}>
                <img
                  src={book.cover_url || FALLBACK_COVER}
                  alt={`Couverture de ${book.title || 'livre'}`}
                  className="writer-cover"
                  onError={e => { e.currentTarget.src = FALLBACK_COVER }}
                />

                <div className="writer-content">
                  <div className="writer-meta">
                    <span className="badge">{book.category || 'Sans catégorie'}</span>
                    <span className={book.is_free ? 'price free-text' : 'price'}>
                      {book.is_free ? 'Gratuit' : `${book.price || 0} FCFA`}
                    </span>
                  </div>

                  <h2>{book.title || 'Sans titre'}</h2>
                  <p>{book.author || 'Auteur inconnu'}</p>

                  <div className="writer-actions">
                    <Link to={`/read/${book.id}`} className="btn">Voir le livre</Link>
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => deleteBook(book)}
                      disabled={deleting === book.id}
                    >
                      {deleting === book.id ? 'Suppression...' : '🗑️ Supprimer'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
