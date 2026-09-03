import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { useAuth } from '../AuthContext.jsx'

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

  async function deleteBook(book) {
    if (!window.confirm(`Supprimer « ${book.title} » ? Cette action est définitive.`)) return
    setDeleting(book.id)
    setError('')
    try {
      const paths = []
      if (book.cover_url) {
        const match = book.cover_url.match(/\/covers\/([^?]+)/)
        if (match) paths.push({ bucket: 'covers', path: decodeURIComponent(match[1]) })
      }
      if (book.file_url || book.book_url) {
        const url = book.file_url || book.book_url
        const match = url.match(/\/books\/([^?]+)/)
        if (match) paths.push({ bucket: 'books', path: decodeURIComponent(match[1]) })
      }

      for (const item of paths) {
        const { error: storageError } = await supabase.storage.from(item.bucket).remove([item.path])
        if (storageError) console.warn(storageError)
      }

      const { error: deleteError } = await supabase.from('books').delete().eq('id', book.id).eq('owner_id', user.id)
      if (deleteError) throw deleteError
      setBooks(prev => prev.filter(item => item.id !== book.id))
    } catch (err) {
      setError(err.message || 'Impossible de supprimer le livre.')
    } finally {
      setDeleting(null)
    }
  }

  if (authLoading || loading) return <div className="state">Chargement de votre espace écrivain...</div>
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
          <p className="eyebrow">ESPACE ÉCRIVAIN</p>
          <h1>Mes publications</h1>
          <p>Gérez vos livres publiés sur MIMOU BOOKISM.</p>
        </section>

        {error && <div className="notice error-box">{error}</div>}

        {books.length === 0 ? (
          <div className="empty-card">
            <h2>Vous n'avez encore publié aucun livre.</h2>
            <p>Votre prochaine histoire peut commencer ici.</p>
            <Link to="/publier" className="btn primary">Publier mon premier livre</Link>
          </div>
        ) : (
          <section className="writer-grid">
            {books.map(book => (
              <article className="writer-card" key={book.id}>
                <img src={book.cover_url || 'https://placehold.co/400x560/0f172a/94a3b8?text=MIMOU+BOOKISM'} alt="" className="writer-cover" />
                <div className="writer-content">
                  <span className="badge">{book.category || 'Sans catégorie'}</span>
                  <h2>{book.title}</h2>
                  <p>{book.author || 'Auteur inconnu'}</p>
                  <div className="writer-actions">
                    <Link to={`/read/${book.id}`} className="btn">Voir</Link>
                    <button className="btn danger" onClick={() => deleteBook(book)} disabled={deleting === book.id}>
                      {deleting === book.id ? 'Suppression...' : 'Supprimer'}
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
