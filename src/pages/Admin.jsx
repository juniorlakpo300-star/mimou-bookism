import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { useAuth } from '../AuthContext.jsx'

const ADMIN_EMAIL = 'juniorlakpo300@gmail.com'

export default function Admin() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState(ADMIN_EMAIL)
  const [password, setPassword] = useState('')
  const [accessGranted, setAccessGranted] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Toutes')

  useEffect(() => {
    if (!authLoading && user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      setAccessGranted(true)
      loadBooks()
    }
  }, [authLoading, user])

  async function loadBooks() {
    setLoading(true)
    setError('')

    const { data, error: booksError } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })

    if (booksError) setError(booksError.message)
    else setBooks(data || [])

    setLoading(false)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')

    const cleanEmail = email.trim().toLowerCase()
    if (cleanEmail !== ADMIN_EMAIL.toLowerCase()) {
      setLoginError('Cet e-mail n’est pas autorisé à accéder à l’administration.')
      return
    }

    setLoading(true)
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    })
    setLoading(false)

    if (authError) {
      setLoginError('Connexion impossible : e-mail ou mot de passe incorrect.')
      return
    }

    if (data.user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      await supabase.auth.signOut()
      setLoginError('Ce compte n’est pas autorisé à accéder à l’administration.')
      return
    }

    setAccessGranted(true)
    setPassword('')
    await loadBooks()
  }

  async function handleLogoutAdmin() {
    await supabase.auth.signOut()
    setAccessGranted(false)
    setBooks([])
    setSearch('')
    setCategory('Toutes')
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
          storageItems.push({ bucket: 'covers', path: decodeURIComponent(match[1]) })
        }
      }

      const pdfUrl = book.file_url || book.book_url
      if (pdfUrl) {
        const match = pdfUrl.match(/\/books\/([^?]+)/)
        if (match) {
          storageItems.push({ bucket: 'books', path: decodeURIComponent(match[1]) })
        }
      }

      if (book.file_path && !storageItems.some(item => item.bucket === 'books' && item.path === book.file_path)) {
        storageItems.push({ bucket: 'books', path: book.file_path })
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

  const categories = useMemo(() => {
    const values = books.map(book => book.category?.trim()).filter(Boolean)
    return ['Toutes', ...Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))]
  }, [books])

  const filteredBooks = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    return books.filter(book => {
      const matchesCategory = category === 'Toutes' || book.category?.trim() === category
      const matchesSearch = !searchValue ||
        book.title?.toLowerCase().includes(searchValue) ||
        book.author?.toLowerCase().includes(searchValue) ||
        book.category?.toLowerCase().includes(searchValue)
      return matchesCategory && matchesSearch
    })
  }, [books, search, category])

  if (authLoading) return <div className="state">Vérification de l'accès...</div>

  if (!accessGranted || user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return (
      <main className="page">
        <div className="container">
          <header className="header">
            <Link to="/" className="brand">MIMOU <span>BOOKISM</span></Link>
          </header>

          <section className="dashboard-hero admin-hero">
            <p className="eyebrow">ESPACE ADMINISTRATEUR</p>
            <h1>Connexion administrateur</h1>
            <p>Seul le compte administrateur autorisé peut accéder à cet espace.</p>
          </section>

          <form onSubmit={handleLogin} className="admin-password-card">
            <label htmlFor="admin-email">E-mail administrateur</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="username"
              required
            />

            <label htmlFor="admin-password">Mot de passe</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mot de passe Supabase"
              autoComplete="current-password"
              required
            />

            {loginError && <p className="notice error-box">{loginError}</p>}

            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter en tant qu’administrateur'}
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
          <Link to="/" className="brand">MIMOU <span>BOOKISM</span></Link>
          <nav className="nav">
            <Link to="/catalogue" className="btn">Catalogue</Link>
            <Link to="/publier" className="btn primary">+ Publier</Link>
            <button onClick={handleLogoutAdmin} className="btn danger">Déconnexion</button>
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
              <div className="stat-card"><strong>{books.length}</strong><span>Livres publiés</span></div>
              <div className="stat-card"><strong>{books.filter(book => book.is_free).length}</strong><span>Livres gratuits</span></div>
              <div className="stat-card"><strong>{books.filter(book => !book.is_free).length}</strong><span>Livres payants</span></div>
            </div>

            <section className="admin-filters">
              <div className="search-box">
                <label htmlFor="admin-search">Rechercher un livre</label>
                <input id="admin-search" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Titre, auteur ou catégorie..." />
              </div>
              <div className="filter-box">
                <label htmlFor="admin-category">Catégorie</label>
                <select id="admin-category" value={category} onChange={e => setCategory(e.target.value)}>
                  {categories.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            </section>

            <div className="admin-results-info">
              {filteredBooks.length} livre{filteredBooks.length !== 1 ? 's' : ''} affiché{filteredBooks.length !== 1 ? 's' : ''}
              {search || category !== 'Toutes' ? ' selon les filtres' : ''}
            </div>

            <section className="admin-list">
              {filteredBooks.length === 0 ? (
                <div className="empty-card">
                  <h2>Aucun livre trouvé</h2>
                  <p>Essayez une autre recherche ou une autre catégorie.</p>
                </div>
              ) : (
                filteredBooks.map(book => (
                  <article className="admin-row" key={book.id}>
                    <img src={book.cover_url || 'https://placehold.co/160x220/0f172a/94a3b8?text=BOOK'} alt={`Couverture de ${book.title || 'livre'}`} />
                    <div className="admin-info">
                      <span className="badge">{book.category || 'Sans catégorie'}</span>
                      <h2>{book.title || 'Sans titre'}</h2>
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
                ))
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
