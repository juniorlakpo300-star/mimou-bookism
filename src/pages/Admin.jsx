import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { useAuth } from '../AuthContext.jsx'

export default function Admin() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    if (!authLoading && !user) navigate('/connexion', { replace: true })
  }, [authLoading, user, navigate])

  useEffect(() => {
    if (!user) return
    async function checkAdminAndLoad() {
      const { data: adminRow, error: adminError } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (adminError || !adminRow) {
        setError('Accès réservé à l’administrateur.')
        setLoading(false)
        return
      }

      const { data, error: booksError } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false })

      if (booksError) setError(booksError.message)
      else setBooks(data || [])
      setLoading(false)
    }
    checkAdminAndLoad()
  }, [user])

  async function deleteBook(book) {
    if (!window.confirm(`Supprimer définitivement « ${book.title} » ?`)) return
    setDeleting(book.id)
    setError('')
    try {
      const storageItems = []
      if (book.cover_url) {
        const match = book.cover_url.match(/\/covers\/([^?]+)/)
        if (match) storageItems.push({ bucket: 'covers', path: decodeURIComponent(match[1]) })
      }
      const pdfUrl = book.file_url || book.book_url
      if (pdfUrl) {
        const match = pdfUrl.match(/\/books\/([^?]+)/)
        if (match) storageItems.push({ bucket: 'books', path: decodeURIComponent(match[1]) })
      }

      for (const item of storageItems) {
        const { error: storageError } = await supabase.storage.from(item.bucket).remove([item.path])
        if (storageError) console.warn(storageError)
      }

      const { error: deleteError } = await supabase.from('books').delete().eq('id', book.id)
      if (deleteError) throw deleteError
      setBooks(prev => prev.filter(item => item.id !== book.id))
    } catch (err) {
      setError(err.message || 'Impossible de supprimer le livre.')
    } finally {
      setDeleting(null)
    }
  }

  if (authLoading || loading) return <div className="state">Chargement de l'administration...</div>
  if (!user) return null

  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <Link to="/catalogue" className="brand">MIMOU <span>BOOKISM</span></Link>
          <nav className="nav">
            <Link to="/catalogue" className="btn">Catalogue</Link>
            <Link to="/ecrivain" className="btn">Espace écrivain</Link>
          </nav>
        </header>

        <section className="dashboard-hero admin-hero">
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>Tableau de bord</h1>
          <p>Gérez les publications de MIMOU BOOKISM.</p>
        </section>

        {error ? <div className="notice error-box">{error}</div> : (
          <>
            <div className="stats-row">
              <div className="stat-card"><strong>{books.length}</strong><span>Livres publiés</span></div>
              <div className="stat-card"><strong>{books.filter(book => book.is_free).length}</strong><span>Livres gratuits</span></div>
              <div className="stat-card"><strong>{books.filter(book => !book.is_free).length}</strong><span>Livres payants</span></div>
            </div>
            <section className="admin-list">
              {books.map(book => (
                <article className="admin-row" key={book.id}>
                  <img src={book.cover_url || 'https://placehold.co/160x220/0f172a/94a3b8?text=BOOK'} alt="" />
                  <div className="admin-info">
                    <span className="badge">{book.category || 'Sans catégorie'}</span>
                    <h2>{book.title}</h2>
                    <p>{book.author || 'Auteur inconnu'}</p>
                    <small>Propriétaire : {book.owner_id || 'ancien livre'}</small>
                  </div>
                  <div className="admin-actions">
                    <Link to={`/read/${book.id}`} className="btn">Ouvrir</Link>
                    <button className="btn danger" onClick={() => deleteBook(book)} disabled={deleting === book.id}>
                      {deleting === book.id ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </div>
                </article>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
