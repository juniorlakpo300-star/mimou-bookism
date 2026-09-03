import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabase'

const FALLBACK_COVER = 'https://placehold.co/400x560/0f172a/94a3b8?text=MIMOU+BOOKISM'
const PSEUDO_KEY = 'mimou_bookism_pseudo'
const SECTION_KEY = 'mimou_bookism_section'
const FAVORITES_KEY = 'mimou_bookism_favorites'
const LAST_READ_KEY = 'mimou_bookism_last_read'

function getFavorites() {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]') } catch { return [] }
}

export default function Reader() {
  const { id } = useParams()
  const [book, setBook] = useState(null)
  const [comments, setComments] = useState([])
  const [pseudo, setPseudo] = useState(() => localStorage.getItem(PSEUDO_KEY) || '')
  const [comment, setComment] = useState('')
  const [favorites, setFavorites] = useState(getFavorites)
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

        const manga = String(bookData?.category || '').toLowerCase().startsWith('manga •')
        localStorage.setItem(SECTION_KEY, manga ? 'manga' : 'books')
        localStorage.setItem(LAST_READ_KEY, JSON.stringify({ id: bookData.id, title: bookData.title, cover_url: bookData.cover_url, at: Date.now() }))

        const filePath = bookData?.file_path || `${bookData?.id || id}.pdf`
        const { data: signedData, error: signedError } = await supabase.storage
          .from('books')
          .createSignedUrl(filePath, 60 * 60)

        if (!signedError && signedData?.signedUrl) {
          setPdfUrl(signedData.signedUrl)
        } else if (bookData?.file_url || bookData?.book_url) {
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

    const cleanPseudo = pseudo.trim()
    const content = comment.trim()

    if (cleanPseudo.length < 2) {
      alert('Ton pseudo doit contenir au moins 2 caractères.')
      return
    }
    if (cleanPseudo.length > 30) {
      alert('Ton pseudo ne peut pas dépasser 30 caractères.')
      return
    }
    if (!content) {
      alert('Écris un commentaire avant de publier.')
      return
    }
    if (content.length > 2000) {
      alert('Le commentaire ne peut pas dépasser 2000 caractères.')
      return
    }

    setSending(true)

    const { data, error: insertError } = await supabase.from('comments').insert({
      book_id: id,
      user_email: cleanPseudo,
      content
    }).select().single()

    if (insertError) {
      alert(`Impossible de publier le commentaire : ${insertError.message}`)
    } else {
      localStorage.setItem(PSEUDO_KEY, cleanPseudo)
      setPseudo(cleanPseudo)
      setComments(prev => [data, ...prev])
      setComment('')
    }

    setSending(false)
  }

  function toggleFavorite() {
    const next = favorites.includes(id) ? favorites.filter(item => item !== id) : [...favorites, id]
    setFavorites(next)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
  }

  if (loading) return <div className="state">Chargement...</div>
  if (error && !book) return <div className="state error">Erreur : {error}</div>
  if (!book) return <div className="state">Œuvre introuvable.</div>

  const isManga = String(book.category || '').toLowerCase().startsWith('manga •')
  const theme = isManga ? 'manga-reader' : 'books-reader'
  const backPath = isManga ? '/mangas' : '/livres'
  const typeLabel = isManga ? 'Manga' : 'Livre'
  const isFavorite = favorites.includes(id)

  return (
    <main className={`reader ${theme}`}>
      <div className="reader-card">
        <Link to={backPath} className="btn">← {isManga ? 'Mangathèque' : 'Bibliothèque'}</Link>

        <h1>{book.title}</h1>
        <p className="reader-author">
          {book.author || (isManga ? 'Mangaka inconnu' : 'Auteur inconnu')} {book.category ? `• ${book.category}` : ''} • Gratuit
        </p>

        <img className="reader-cover" src={book.cover_url || FALLBACK_COVER} alt={`Couverture de ${book.title}`} onError={e => { e.currentTarget.src = FALLBACK_COVER }} />

        {book.description && <p className="reader-description">{book.description}</p>}
        {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}

        <div className="reader-actions">
          <button type="button" className={`btn ${isFavorite ? 'favorite-reading' : ''}`} onClick={toggleFavorite}>
            {isFavorite ? '❤️ Dans ma bibliothèque' : '♡ Ajouter à ma bibliothèque'}
          </button>
          {pdfUrl ? (
            <>
              <a className="btn primary" href={pdfUrl} target="_blank" rel="noreferrer">📖 Lire le {typeLabel}</a>
              <a className="btn" href={pdfUrl} download>Télécharger</a>
            </>
          ) : (
            <span className="muted">Aucun PDF disponible.</span>
          )}
        </div>

        {pdfUrl && <iframe className="pdf-frame" src={pdfUrl} title={`Lecture de ${book.title}`} />}

        <section className="comments">
          <h2>💬 Commentaires</h2>
          <p className="muted">Tu peux commenter sans créer de compte. Choisis simplement un pseudo.</p>

          <form onSubmit={addComment} className="comment-form">
            <label htmlFor="comment-pseudo">Votre pseudo</label>
            <input id="comment-pseudo" type="text" value={pseudo} onChange={e => setPseudo(e.target.value)} placeholder="Ex. Junior, Lecteur2026..." minLength="2" maxLength="30" autoComplete="nickname" required />

            <label htmlFor="comment-content">Votre commentaire</label>
            <textarea id="comment-content" value={comment} onChange={e => setComment(e.target.value)} placeholder={`Écris ton commentaire sur ce ${isManga ? 'manga' : 'livre'}...`} rows="4" maxLength="2000" required />

            <button type="submit" className="btn primary" disabled={sending}>
              {sending ? 'Publication...' : '💬 Publier le commentaire'}
            </button>
          </form>

          <div className="comment-list">
            {comments.length === 0 ? (
              <p className="muted">Aucun commentaire pour le moment. Sois le premier à commenter !</p>
            ) : comments.map(item => (
              <article className="comment" key={item.id}>
                <strong>{item.user_email || 'Lecteur'}</strong>
                <p>{item.content}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
