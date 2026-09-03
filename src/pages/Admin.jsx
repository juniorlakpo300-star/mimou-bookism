import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase.js'

const ADMIN_PASSWORD = 'MIMOU2026'

export default function Admin() {
  const [password, setPassword] = useState('')
  const [accessGranted, setAccessGranted] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    const savedAccess = sessionStorage.getItem('mimou_admin_access')
    if (savedAccess === 'true') {
      setAccessGranted(true)
      loadBooks()
    }
  }, [])

  async function loadBooks() {
    setLoading(true)
    setError('')

    const { data, error: booksError } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })

    if (booksError) {
      setError(booksError.message)
    } else {
      setBooks(data || [])
    }

    setLoading(false)
  }

  function handlePasswordSubmit(e) {
    e.preventDefault()
    setPasswordError('')

    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('mimou_admin_access', 'true')
      setAccessGranted(true)
      setPassword('')
      loadBooks()
    } else {
      setPasswordError('Mot de passe incorrect.')
    }
  }

  function handleLogoutAdmin() {
    sessionStorage.removeItem('mimou_admin_access')
    setAccessGranted(false)
    setBooks([])
  }

  async function deleteBook(book) {
    if (!window.confirm(`Supprimer définitivement « ${book.title} » ?`)) return

    setDeleting(book.id)
    setError('')

    try {
      const storageItems = []

      if (book.cover_url) {
        const match = book.cover_url.match(/\/covers\/([^?]+)/)
        if (match) {
          storageItems.push({
            bucket: 'covers',
            path: decodeURIComponent(match[1])
          })
        }
      }

      const pdfUrl = book.file_url || book.book_url
      if (pdfUrl) {
        const match = pdfUrl.match(/\/books\/([^?]+)/)
        if (match) {
          storageItems.push({
            bucket: 'books',
            path: decodeURIComponent(match[1])
          })
        }
      }

      for (const item of storageItems) {
        const { error: storageError } = await supabase.storage
          .from(item.bucket)
          .remove([item.path])

        if (storageError) console.warn(storageError)
      }

      const { error: deleteError } = await supabase
        .from('books')
        .delete()
        .eq('id', book.id)

      if (deleteError) throw deleteError

      setBooks(prev => prev.filter(item => item.id !== book.id))
    } catch (err) {
      setError(err.message || 'Impossible de supprimer le livre.')
    } finally {
      setDeleting(null)
    }
  }

  if (!accessGranted) {
    return (
      <main className="page">
        <div className="container">
          <header className="header">
            <Link to="/catalogue" className="brand">
              MIMOU <span>BOOKISM</span>
            </Link>
          </header>

          <section className="dashboard-hero admin-hero">
            <p className="eyebrow">ESPACE ADMINISTRATEUR</p>
            <h1>Accès administrateur</h1>
            <p>Entrez le mot de passe pour accéder au tableau de bord.</p>
          </section>

          <form onSubmit={handlePasswordSubmit} className="admin-password-card">
            <label htmlFor="admin-password">Mot de passe</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Entrez le mot de passe"
              autoFocus
              required
            />

            {passwordError && (
              <p className="notice error-box">{passwordError}</p>
            )}

            <button type="submit" className="btn primary">
              Accéder à l'administration
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <Link to="/catalogue" className="brand">
            MIMOU <span>BOOKISM</span>
          </Link>

          <nav className="nav">
            <Link to="/catalogue" className="btn">Catalogue</Link>
            <Link to="/ecrivain" className="btn">Espace écrivain</Link>
            <button onClick={handleLogoutAdmin} className="btn danger">
              Verrouiller
            </button>
          </nav>
        </header>

        <section className="dashboard-hero admin-hero">
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>Tableau de bord</h1>
          <p>Gérez les publications de MIMOU BOOKISM.</p>
        </section>

        {loading ? (
          <div className="state">Chargement de l'administration...</div>
        ) : error ? (
          <div className="notice error-box">Erreur : {error}</div>
        ) : (
          <>
            <div className="stats-row">
              <div className="stat-card">
                <strong>{books.length}</strong>
                <span>Livres publiés</span>
              </div>
              <div className="stat-card">
                <strong>{books.filter(book => book.is_free).length}</strong>
                <span>Livres gratuits</span>
              </div>
              <div className="stat-card">
                <strong>{books.filter(book => !book.is_free).length}</strong>
                <span>Livres payants</span>
              </div>
            </div>

            <section className="admin-list">
              {books.length === 0 ? (
                <div className="empty-card">
                  <h2>Aucun livre publié</h2>
                  <p>Les livres publiés apparaîtront ici.</p>
                </div>
              ) : (
                books.map(book => (
                  <article className="admin-row" key={book.id}>
                    <img
                      src={book.cover_url || 'https://placehold.co/160x220/0f172a/94a3b8?text=BOOK'}
                      alt={`Couverture de ${book.title || 'livre'}`}
                    />

                    <div className="admin-info">
                      <span className="badge">
                        {book.category || 'Sans catégorie'}
                      </span>
                      <h2>{book.title || 'Sans titre'}</h2>
                      <p>{book.author || 'Auteur inconnu'}</p>
                      <small>
                        Propriétaire : {book.owner_id || 'ancien livre'}
                      </small>
                    </div>

                    <div className="admin-actions">
                      <Link to={`/read/${book.id}`} className="btn">
                        Ouvrir
                      </Link>
                      <button
                        className="btn danger"
                        onClick={() => deleteBook(book)}
                        disabled={deleting === book.id}
                      >
                        {deleting === book.id ? 'Suppression...' : 'Supprimer'}
                      </button>
                    </div>
                  </article>
                ))
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
