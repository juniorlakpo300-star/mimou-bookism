import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../AuthContext.jsx'

const FALLBACK_COVER = 'https://placehold.co/400x560/0f172a/94a3b8?text=MIMOU+BOOKISM'

export default function Reader() {
  const { id } = useParams()
  const { user } = useAuth()
  const [book, setBook] = useState(null)
  const [comments, setComments] = useState([])
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [accessLoading, setAccessLoading] = useState(false)
  const [pdfUrl, setPdfUrl] = useState('')
  const [purchaseRequired, setPurchaseRequired] = useState(false)
  const [loginRequired, setLoginRequired] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [{ data: bookData, error: bookError }, { data: commentData, error: commentError }] = await Promise.all([
        supabase.from('books').select('*').eq('id', id).single(),
        supabase.from('comments').select('*').eq('book_id', id).order('created_at', { ascending: false })
      ])
      if (bookError) setError(bookError.message)
      else setBook(bookData)
      if (commentError) console.error(commentError)
      setComments(commentData || [])
      setLoading(false)
    }
    load()
  }, [id])

  useEffect(() => {
    if (!book) return
    if (!book.is_free && !user) {
      setLoginRequired(true)
      setPurchaseRequired(false)
      setPdfUrl('')
      return
    }

    let cancelled = false
    async function loadAccess() {
      setAccessLoading(true)
      setError('')
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token
        const headers = { 'Content-Type': 'application/json' }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        const response = await fetch('/api/book-access', {
          method: 'POST',
          headers,
          body: JSON.stringify({ bookId: book.id })
        })
        const result = await response.json()
        if (cancelled) return

        if (response.status === 403 && result.requiresPurchase) {
          setPurchaseRequired(true)
          setPdfUrl('')
        } else if (response.status === 401 && result.requiresLogin) {
          setLoginRequired(true)
          setPdfUrl('')
        } else if (!response.ok) {
          throw new Error(result.error || 'Impossible d’ouvrir le livre.')
        } else {
          setPdfUrl(result.url || '')
          setPurchaseRequired(false)
          setLoginRequired(false)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Impossible d’ouvrir le livre.')
      } finally {
        if (!cancelled) setAccessLoading(false)
      }
    }
    loadAccess()
    return () => { cancelled = true }
  }, [book, user])

  async function addComment(event) {
    event.preventDefault()
    if (!user) return
    const content = comment.trim()
    if (!content) return
    setSending(true)

    const { data, error: insertError } = await supabase.from('comments').insert({
      book_id: id,
      user_email: user.email,
      content
    }).select().single()

    if (insertError) alert(`Erreur : ${insertError.message}`)
    else {
      setComments(prev => [data, ...prev])
      setComment('')
    }
    setSending(false)
  }

  if (loading) return <div className="state">Chargement...</div>
  if (error && !book) return <div className="state error">Erreur : {error}</div>
  if (!book) return <div className="state">Livre introuvable.</div>

  const price = Math.round(Number(book.price || 0))

  return (
    <main className="reader">
      <div className="reader-card">
        <Link to="/catalogue" className="btn">← Catalogue</Link>
        <h1>{book.title}</h1>
        <p className="reader-author">
          {book.author || 'Auteur inconnu'} {book.category ? `• ${book.category}` : ''}
          {book.is_free ? ' • Gratuit' : ` • ${price.toLocaleString('fr-FR')} FCFA`}
        </p>

        <img className="reader-cover" src={book.cover_url || FALLBACK_COVER} alt={`Couverture de ${book.title}`} onError={e => { e.currentTarget.src = FALLBACK_COVER }} />
        {book.description && <p className="reader-description">{book.description}</p>}

        {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}

        {book.is_free ? (
          <div className="reader-actions">
            {accessLoading ? <span className="muted">Ouverture du livre...</span> : pdfUrl ? <>
              <a className="btn primary" href={pdfUrl} target="_blank" rel="noreferrer">📖 Lire le PDF</a>
              <a className="btn" href={pdfUrl} download>Télécharger</a>
            </> : <span className="muted">Aucun PDF disponible.</span>}
          </div>
        ) : purchaseRequired ? (
          <div className="reader-actions" style={{ display: 'block' }}>
            <div style={{ padding: 20, borderRadius: 14, background: 'rgba(255,255,255,.05)', marginBottom: 14 }}>
              <strong>🔒 Livre payant</strong>
              <p className="muted">Achète ce livre pour débloquer sa lecture et pouvoir le relire depuis ton compte.</p>
            </div>
            <Link className="btn primary" to={`/paiement?book=${book.id}`}>🛒 Acheter — {price.toLocaleString('fr-FR')} FCFA</Link>
          </div>
        ) : loginRequired ? (
          <div className="reader-actions" style={{ display: 'block' }}>
            <div style={{ padding: 20, borderRadius: 14, background: 'rgba(255,255,255,.05)', marginBottom: 14 }}>
              <strong>🔐 Connexion requise</strong>
              <p className="muted">Connecte-toi pour acheter ce livre et le conserver dans tes achats.</p>
            </div>
            <Link className="btn primary" to={`/connexion?redirect=${encodeURIComponent(`/read/${book.id}`)}`}>Se connecter</Link>
          </div>
        ) : (
          <div className="reader-actions">
            {accessLoading ? <span className="muted">Vérification de ton achat...</span> : pdfUrl ? <>
              <a className="btn primary" href={pdfUrl} target="_blank" rel="noreferrer">📖 Lire le PDF</a>
              <a className="btn" href={pdfUrl} download>Télécharger</a>
            </> : <span className="muted">Aucun PDF disponible.</span>}
          </div>
        )}

        {pdfUrl && <iframe className="pdf-frame" src={pdfUrl} title={`Lecture de ${book.title}`} />}

        <section className="comments">
          <h2>Commentaires</h2>
          {user ? (
            <form onSubmit={addComment} className="comment-form">
              <p className="muted">Connecté en tant que <strong>{user.email}</strong></p>
              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Écris un commentaire..." rows="3" required />
              <button className="btn primary" disabled={sending}>{sending ? 'Envoi...' : 'Commenter'}</button>
            </form>
          ) : (
            <p className="muted">Tu dois être connecté pour commenter. <Link to="/connexion">Se connecter</Link></p>
          )}

          <div className="comment-list">
            {comments.length === 0 ? <p className="muted">Aucun commentaire pour le moment.</p> : comments.map(item => (
              <article className="comment" key={item.id}>
                <strong>{item.user_email}</strong>
                <p>{item.content}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
