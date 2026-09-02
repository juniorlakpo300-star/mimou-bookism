import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabase'

const FALLBACK_COVER = 'https://placehold.co/400x560/0f172a/94a3b8?text=MIMOU+BOOKISM'

export default function Reader() {
  const { id } = useParams()
  const [book, setBook] = useState(null)
  const [comments, setComments] = useState([])
  const [comment, setComment] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [{ data: bookData, error: bookError }, { data: commentData }] = await Promise.all([
        supabase.from('books').select('*').eq('id', id).single(),
        supabase.from('comments').select('*').eq('book_id', id).order('created_at', { ascending: false })
      ])
      if (bookError) setError(bookError.message)
      else setBook(bookData)
      setComments(commentData || [])
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) setEmail(user.email)
      setLoading(false)
    }
    load()
  }, [id])

  async function addComment(event) {
    event.preventDefault()
    if (!comment.trim() || !email.trim()) return
    setSending(true)
    const { data, error: insertError } = await supabase.from('comments').insert({
      book_id: id,
      user_email: email.trim(),
      content: comment.trim()
    }).select().single()
    if (insertError) alert(`Erreur : ${insertError.message}`)
    else {
      setComments(prev => [data, ...prev])
      setComment('')
    }
    setSending(false)
  }

  if (loading) return <div className="state">Chargement...</div>
  if (error) return <div className="state error">Erreur : {error}</div>
  if (!book) return <div className="state">Livre introuvable.</div>

  const pdfUrl = book.file_url || book.book_url

  return (
    <main className="reader">
      <div className="reader-card">
        <Link to="/catalogue" className="btn">← Catalogue</Link>
        <h1>{book.title}</h1>
        <p className="reader-author">{book.author || 'Auteur inconnu'} {book.category ? `• ${book.category}` : ''}</p>

        <img className="reader-cover" src={book.cover_url || FALLBACK_COVER} alt={`Couverture de ${book.title}`} />
        {book.description && <p className="reader-description">{book.description}</p>}

        <div className="reader-actions">
          {pdfUrl ? <>
            <a className="btn primary" href={pdfUrl} target="_blank" rel="noreferrer">📖 Lire le PDF</a>
            <a className="btn" href={pdfUrl} download>Télécharger</a>
          </> : <span className="muted">Aucun PDF disponible.</span>}
        </div>

        {pdfUrl && <iframe className="pdf-frame" src={pdfUrl} title={`Lecture de ${book.title}`} />}

        <section className="comments">
          <h2>Commentaires</h2>
          <form onSubmit={addComment} className="comment-form">
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Ton e-mail" required />
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Écris un commentaire..." rows="3" required />
            <button className="btn primary" disabled={sending}>{sending ? 'Envoi...' : 'Commenter'}</button>
          </form>
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
