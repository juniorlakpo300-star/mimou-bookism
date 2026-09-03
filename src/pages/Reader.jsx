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
  const [pdfUrl, setPdfUrl] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [{ data: bookData, error: bookError }, { data: commentData, error: commentError }] = await Promise.all([
        supabase.from('books').select('*').eq('id', id).single(),
        supabase.from('comments').select('*').eq('book_id', id).order('created_at', { ascending: false })
      ])

      if (bookError) {
        setError(bookError.message)
      } else {
        setBook(bookData)

        // Les PDF sont stockés dans le bucket privé « books ».
        // On crée une URL signée à partir de file_path.
        const filePath = bookData?.file_path || `${bookData?.id || id}.pdf`
        const { data: signedData, error: signedError } = await supabase.storage
          .from('books')
          .createSignedUrl(filePath, 60 * 60)

        if (!signedError && signedData?.signedUrl) {
          setPdfUrl(signedData.signedUrl)
        } else if (bookData?.file_url || bookData?.book_url) {
          // Compatibilité avec les anciens livres déjà enregistrés.
          setPdfUrl(bookData.file_url || bookData.book_url)
        } else {
          setPdfUrl('')
          if (signedError) console.error('PDF:', signedError)
        }
      }

      if (commentError) console.error(commentError)
      setComments(commentData || [])
      setLoading(false)
    }

    load()
  }, [id])

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

  return (
    <main className="reader">
      <div className="reader-card">
        <Link to="/catalogue" className="btn">← Catalogue</Link>

        <h1>{book.title}</h1>
        <p className="reader-author">
          {book.author || 'Auteur inconnu'} {book.category ? `• ${book.category}` : ''} • Gratuit
        </p>

        <img
          className="reader-cover"
          src={book.cover_url || FALLBACK_COVER}
          alt={`Couverture de ${book.title}`}
          onError={e => { e.currentTarget.src = FALLBACK_COVER }}
        />

        {book.description && <p className="reader-description">{book.description}</p>}

        {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}

        <div className="reader-actions">
          {pdfUrl ? (
            <>
              <a className="btn primary" href={pdfUrl} target="_blank" rel="noreferrer">📖 Lire le PDF</a>
              <a className="btn" href={pdfUrl} download>Télécharger</a>
            </>
          ) : (
            <span className="muted">Aucun PDF disponible.</span>
          )}
        </div>

        {pdfUrl && (
          <iframe
            className="pdf-frame"
            src={pdfUrl}
            title={`Lecture de ${book.title}`}
          />
        )}

        <section className="comments">
          <h2>Commentaires</h2>

          {user ? (
            <form onSubmit={addComment} className="comment-form">
              <p className="muted">Connecté en tant que <strong>{user.email}</strong></p>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Écris un commentaire..."
                rows="3"
                required
              />
              <button className="btn primary" disabled={sending}>
                {sending ? 'Envoi...' : 'Commenter'}
              </button>
            </form>
          ) : (
            <p className="muted">
              Tu dois être connecté pour commenter. <Link to="/connexion">Se connecter</Link>
            </p>
          )}

          <div className="comment-list">
            {comments.length === 0 ? (
              <p className="muted">Aucun commentaire pour le moment.</p>
            ) : comments.map(item => (
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
