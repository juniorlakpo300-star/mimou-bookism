import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { useAuth } from '../AuthContext.jsx'

const ADMIN_EMAIL = 'juniorlakpo300@gmail.com'
const BOOK_FALLBACK = 'https://placehold.co/160x220/0f172a/94a3b8?text=BOOK'

export default function Admin() {
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState(ADMIN_EMAIL)
  const [password, setPassword] = useState('')
  const [accessGranted, setAccessGranted] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [books, setBooks] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [deletingComment, setDeletingComment] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Toutes')
  const [commentSearch, setCommentSearch] = useState('')

  useEffect(() => {
    if (!authLoading && user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      setAccessGranted(true)
      loadBooks()
      loadComments()
    }
  }, [authLoading, user])

  async function loadBooks() {
    setLoading(true)
    setError('')
    const { data, error: booksError } = await supabase.from('books').select('*').order('created_at', { ascending: false })
    if (booksError) setError(booksError.message)
    else setBooks(data || [])
    setLoading(false)
  }

  async function loadComments() {
    setCommentsLoading(true)
    const { data, error: commentsError } = await supabase
      .from('comments')
      .select('id, book_id, user_email, content, created_at')
      .order('created_at', { ascending: false })
    if (commentsError) setError(commentsError.message)
    else setComments(data || [])
    setCommentsLoading(false)
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
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
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
    await Promise.all([loadBooks(), loadComments()])
  }

  async function handleLogoutAdmin() {
    await supabase.auth.signOut()
    setAccessGranted(false)
    setBooks([])
    setComments([])
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
        if (match) storageItems.push({ bucket: 'covers', path: decodeURIComponent(match[1]) })
      }
      const pdfUrl = book.file_url || book.book_url
      if (pdfUrl) {
        const match = pdfUrl.match(/\/books\/([^?]+)/)
        if (match) storageItems.push({ bucket: 'books', path: decodeURIComponent(match[1]) })
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
      setComments(prev => prev.filter(item => item.book_id !== book.id))
    } catch (err) {
      setError(err.message || 'Impossible de supprimer le livre.')
    } finally {
      setDeleting(null)
    }
  }

  async function deleteComment(comment) {
    if (!window.confirm(`Supprimer le commentaire de « ${comment.user_email || 'Lecteur'} » ?`)) return
    setDeletingComment(comment.id)
    setError('')
    const { error: deleteError } = await supabase.from('comments').delete().eq('id', comment.id)
    if (deleteError) setError(deleteError.message)
    else setComments(prev => prev.filter(item => item.id !== comment.id))
    setDeletingComment(null)
  }

  const categories = useMemo(() => {
    const values = books.map(book => book.category?.trim()).filter(Boolean)
    return ['Toutes', ...Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))]
  }, [books])

  const filteredBooks = useMemo(() => {
    const searchValue = search.trim().toLowerCase()
    return books.filter(book => {
      const matchesCategory = category === 'Toutes' || book.category?.trim() === category
      const matchesSearch = !searchValue || book.title?.toLowerCase().includes(searchValue) || book.author?.toLowerCase().includes(searchValue) || book.category?.toLowerCase().includes(searchValue)
      return matchesCategory && matchesSearch
    })
  }, [books, search, category])

  const filteredComments = useMemo(() => {
    const q = commentSearch.trim().toLowerCase()
    return comments.filter(item => !q || item.user_email?.toLowerCase().includes(q) || item.content?.toLowerCase().includes(q) || item.book_id?.toLowerCase().includes(q))
  }, [comments, commentSearch])

  const mangaCount = books.filter(book => String(book.category || '').toLowerCase().startsWith('manga •')).length
  const freeCount = books.filter(book => book.is_free).length
  const totalViews = books.reduce((sum, book) => sum + Number(book.views_count || 0), 0)

  if (authLoading) return <div className="state">Vérification de l'accès...</div>

  if (!accessGranted || user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return (
      <main className="page">
        <div className="container">
          <header className="header"><Link to="/" className="brand">MIMOU <span>BOOKISM</span></Link></header>
          <section className="dashboard-hero admin-hero"><p className="eyebrow">ESPACE ADMINISTRATEUR</p><h1>Connexion administrateur</h1><p>Seul le compte administrateur autorisé peut accéder à cet espace.</p></section>
          <form onSubmit={handleLogin} className="admin-password-card">
            <label htmlFor="admin-email">E-mail administrateur</label>
            <input id="admin-email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" required />
            <label htmlFor="admin-password">Mot de passe</label>
            <input id="admin-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe Supabase" autoComplete="current-password" required />
            {loginError && <p className="notice error-box">{loginError}</p>}
            <button type="submit" className="btn primary" disabled={loading}>{loading ? 'Connexion...' : 'Se connecter en tant qu’administrateur'}</button>
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

        <section className="dashboard-hero admin-hero"><p className="eyebrow">ADMINISTRATION</p><h1>Tableau de bord</h1><p>Publications, statistiques et modération de MIMOU BOOKISM.</p></section>

        {error && <div className="notice error-box">Erreur : {error}</div>}

        <div className="stats-row">
          <div className="stat-card"><strong>{books.length}</strong><span>Publications</span></div>
          <div className="stat-card"><strong>{mangaCount}</strong><span>Mangas</span></div>
          <div className="stat-card"><strong>{freeCount}</strong><span>Gratuits</span></div>
          <div className="stat-card"><strong>{totalViews}</strong><span>Lectures</span></div>
          <div className="stat-card"><strong>{comments.length}</strong><span>Commentaires</span></div>
        </div>

        <section className="admin-filters">
          <div className="search-box"><label htmlFor="admin-search">Rechercher une publication</label><input id="admin-search" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Titre, auteur ou catégorie..." /></div>
          <div className="filter-box"><label htmlFor="admin-category">Catégorie</label><select id="admin-category" value={category} onChange={e => setCategory(e.target.value)}>{categories.map(item => <option key={item} value={item}>{item}</option>)}</select></div>
        </section>

        <div className="admin-results-info">{filteredBooks.length} publication{filteredBooks.length !== 1 ? 's' : ''}</div>
        <section className="admin-list">
          {loading ? <div className="state">Chargement...</div> : filteredBooks.length === 0 ? <div className="empty-card"><h2>Aucune publication</h2><p>Essayez une autre recherche.</p></div> : filteredBooks.map(book => {
            const isManga = String(book.category || '').toLowerCase().startsWith('manga •')
            return <article className="admin-row" key={book.id}>
              <img src={book.cover_url || BOOK_FALLBACK} alt={`Couverture de ${book.title || 'publication'}`} />
              <div className="admin-info"><span className="badge">{isManga ? '🗯️ MANGA' : '📚 LIVRE'} · {book.category || 'Sans catégorie'}</span><h2>{book.title || 'Sans titre'}</h2><p>{book.author || 'Auteur inconnu'}</p><small>👁️ {Number(book.views_count || 0)} lecture(s) · ID {book.id}</small></div>
              <div className="admin-actions"><Link to={`/read/${book.id}`} className="btn">Ouvrir</Link><button className="btn danger" onClick={() => deleteBook(book)} disabled={deleting === book.id}>{deleting === book.id ? 'Suppression...' : 'Supprimer'}</button></div>
            </article>
          })}
        </section>

        <section className="admin-moderation">
          <div className="catalogue-heading"><div><p className="section-kicker">MODÉRATION</p><h2>Commentaires</h2></div><span className="result-count">{filteredComments.length} affiché{filteredComments.length > 1 ? 's' : ''}</span></div>
          <input className="admin-comment-search" value={commentSearch} onChange={e => setCommentSearch(e.target.value)} placeholder="🔎 Rechercher un pseudo ou commentaire..." aria-label="Rechercher un commentaire" />
          {commentsLoading ? <div className="empty-card"><p>Chargement des commentaires...</p></div> : filteredComments.length === 0 ? <div className="empty-card"><h2>Aucun commentaire</h2><p>La modération est à jour.</p></div> : <div className="admin-comments-list">{filteredComments.map(item => {
            const relatedBook = books.find(book => book.id === item.book_id)
            return <article className="admin-comment-row" key={item.id}><div><strong>💬 {item.user_email || 'Lecteur'}</strong><span>{relatedBook?.title || 'Publication supprimée'}</span><p>{item.content}</p><small>{item.created_at ? new Date(item.created_at).toLocaleString('fr-FR') : ''}</small></div><button className="btn danger" onClick={() => deleteComment(item)} disabled={deletingComment === item.id}>{deletingComment === item.id ? 'Suppression...' : '🗑️ Supprimer'}</button></article>
          })}</div>}
        </section>
      </div>
    </main>
  )
}
