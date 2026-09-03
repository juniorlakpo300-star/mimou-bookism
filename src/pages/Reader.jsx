import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabase'

const FALLBACK_COVER = 'https://placehold.co/400x560/0f172a/94a3b8?text=MIMOU+BOOKISM'
const PSEUDO_KEY = 'mimou_bookism_pseudo'
const SECTION_KEY = 'mimou_bookism_section'
const FAVORITES_KEY = 'mimou_bookism_favorites'
const LAST_READ_KEY = 'mimou_bookism_last_read'
const BOOKMARKS_KEY = 'mimou_bookism_bookmarks'
const PROGRESS_KEY = 'mimou_bookism_reading_progress'
const REWARDS_KEY = 'mimou_bookism_rewards'
const READING_MODE_KEY = 'mimou_bookism_reading_mode'
const BOOK_FIELDS = 'id,title,author,category,description,cover_url,file_path,file_url,book_url,is_free,price,views_count'

function getFavorites() { try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]') } catch { return [] } }
function getBookmarks() { try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '{}') } catch { return {} } }
function getProgress() { try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}') } catch { return {} } }
function getRewards() { try { return JSON.parse(localStorage.getItem(REWARDS_KEY) || '{}') } catch { return {} } }

export default function Reader() {
  const { id } = useParams()
  const [book, setBook] = useState(null)
  const [comments, setComments] = useState([])
  const [pseudo, setPseudo] = useState(() => localStorage.getItem(PSEUDO_KEY) || '')
  const [comment, setComment] = useState('')
  const [favorites, setFavorites] = useState(getFavorites)
  const [bookmarks, setBookmarks] = useState(getBookmarks)
  const [progress, setProgress] = useState(() => Number(getProgress()[id] || 0))
  const [rating, setRating] = useState(0)
  const [averageRating, setAverageRating] = useState(0)
  const [ratingCount, setRatingCount] = useState(0)
  const [readingMode, setReadingMode] = useState(() => localStorage.getItem(READING_MODE_KEY) === '1')
  const [fullscreen, setFullscreen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pdfUrl, setPdfUrl] = useState('')
  const [sending, setSending] = useState(false)
  const [ratingSending, setRatingSending] = useState(false)
  const [rewardNotice, setRewardNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { setProgress(Number(getProgress()[id] || 0)) }, [id])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && readingMode) {
        setReadingMode(false)
        localStorage.setItem(READING_MODE_KEY, '0')
      }
      if (event.key.toLowerCase() === 'f' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        event.preventDefault()
        setReadingMode(current => {
          const next = !current
          localStorage.setItem(READING_MODE_KEY, next ? '1' : '0')
          return next
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [readingMode])

  useEffect(() => {
    function handleFullscreenChange() { setFullscreen(Boolean(document.fullscreenElement)) }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    let active = true
    async function load() {
      const [{ data: bookData, error: bookError }, { data: commentData, error: commentError }, { data: ratingData, error: ratingError }] = await Promise.all([
        supabase.from('books').select(BOOK_FIELDS).eq('id', id).single(),
        supabase.from('comments').select('id,book_id,user_email,content,created_at').eq('book_id', id).order('created_at', { ascending: false }),
        supabase.from('book_ratings').select('rating').eq('book_id', id)
      ])
      if (!active) return
      if (bookError) setError(bookError.message)
      else {
        setBook(bookData)
        const manga = String(bookData?.category || '').toLowerCase().startsWith('manga •')
        localStorage.setItem(SECTION_KEY, manga ? 'manga' : 'books')
        localStorage.setItem(LAST_READ_KEY, JSON.stringify({ id: bookData.id, title: bookData.title, cover_url: bookData.cover_url, progress: Number(getProgress()[id] || 0), at: Date.now() }))
        const readCount = Number(localStorage.getItem('mimou_bookism_read_count') || 0) + 1
        localStorage.setItem('mimou_bookism_read_count', String(readCount))
        const rewards = getRewards()
        const previousReads = Number(rewards.reads || 0)
        rewards.reads = Math.max(previousReads, readCount)
        if (readCount === 1 && !rewards.firstRead) { rewards.firstRead = true; setRewardNotice('🏆 Badge débloqué : Premier chapitre !') }
        if (readCount >= 5 && !rewards.fiveReads) { rewards.fiveReads = true; setRewardNotice('📚 Badge débloqué : Bibliophile !') }
        localStorage.setItem(REWARDS_KEY, JSON.stringify(rewards))
        supabase.rpc('increment_book_views', { book_uuid: bookData.id }).then(({ error: viewError }) => { if (viewError) console.warn('Views:', viewError) })
        const filePath = bookData?.file_path || `${bookData?.id || id}.pdf`
        const { data: signedData, error: signedError } = await supabase.storage.from('books').createSignedUrl(filePath, 60 * 60)
        if (!signedError && signedData?.signedUrl) setPdfUrl(signedData.signedUrl)
        else if (bookData?.file_url || bookData?.book_url) setPdfUrl(bookData.file_url || bookData.book_url)
      }
      if (commentError) console.error(commentError)
      setComments(commentData || [])
      if (!ratingError) {
        const rows = ratingData || []
        setRatingCount(rows.length)
        setAverageRating(rows.length ? rows.reduce((sum, row) => sum + Number(row.rating), 0) / rows.length : 0)
      }
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [id])

  async function addComment(event) {
    event.preventDefault()
    const cleanPseudo = pseudo.trim(); const content = comment.trim()
    if (cleanPseudo.length < 2 || cleanPseudo.length > 30) return alert('Le pseudo doit contenir entre 2 et 30 caractères.')
    if (!content || content.length > 2000) return alert('Le commentaire doit contenir entre 1 et 2000 caractères.')
    setSending(true)
    const { data, error: insertError } = await supabase.from('comments').insert({ book_id: id, user_email: cleanPseudo, content }).select().single()
    if (insertError) alert(`Impossible de publier le commentaire : ${insertError.message}`)
    else { localStorage.setItem(PSEUDO_KEY, cleanPseudo); setPseudo(cleanPseudo); setComments(prev => [data, ...prev]); setComment('') }
    setSending(false)
  }

  async function submitRating(value) {
    const cleanPseudo = pseudo.trim()
    if (cleanPseudo.length < 2 || cleanPseudo.length > 30) return alert('Choisis d’abord un pseudo (2 à 30 caractères).')
    setRating(value); setRatingSending(true)
    const { error: ratingError } = await supabase.from('book_ratings').insert({ book_id: id, pseudo: cleanPseudo, rating: value })
    if (ratingError) alert(`Impossible d'enregistrer la note : ${ratingError.message}`)
    else { setAverageRating(prev => ((prev * ratingCount) + value) / (ratingCount + 1)); setRatingCount(prev => prev + 1) }
    setRatingSending(false)
  }

  function saveProgress(value) {
    const cleanValue = Math.max(0, Math.min(100, Number(value)))
    const previous = progress
    setProgress(cleanValue)
    const next = getProgress(); next[id] = cleanValue
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(next))
    localStorage.setItem(LAST_READ_KEY, JSON.stringify({ id: book?.id || id, title: book?.title || '', cover_url: book?.cover_url || '', progress: cleanValue, at: Date.now() }))
    if (cleanValue >= 100 && previous < 100) {
      const rewards = getRewards(); rewards.completed = Number(rewards.completed || 0) + 1
      if (!rewards.firstComplete) { rewards.firstComplete = true; setRewardNotice('🏁 Badge débloqué : Lecture terminée !') }
      localStorage.setItem(REWARDS_KEY, JSON.stringify(rewards))
    }
  }

  function toggleFavorite() {
    const adding = !favorites.includes(id)
    const next = adding ? [...favorites, id] : favorites.filter(item => item !== id)
    setFavorites(next); localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
    if (adding) {
      const rewards = getRewards(); rewards.favorites = next.length
      if (next.length >= 5 && !rewards.fiveFavorites) { rewards.fiveFavorites = true; setRewardNotice('❤️ Badge débloqué : Collectionneur !') }
      if (next.length >= 10 && !rewards.tenFavorites) { rewards.tenFavorites = true; setRewardNotice('💎 Badge débloqué : Grand collectionneur !') }
      localStorage.setItem(REWARDS_KEY, JSON.stringify(rewards))
    }
  }

  function toggleBookmark() {
    const next = { ...bookmarks }
    if (next[id]) delete next[id]
    else next[id] = { id, title: book.title, cover_url: book.cover_url, savedAt: Date.now(), progress }
    setBookmarks(next); localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next))
    if (!next[id]) setRewardNotice('🔖 Marque-page retiré.')
    else setRewardNotice('🔖 Marque-page enregistré !')
  }

  function toggleReadingMode() {
    const next = !readingMode
    setReadingMode(next)
    localStorage.setItem(READING_MODE_KEY, next ? '1' : '0')
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch (fullscreenError) {
      console.warn('Plein écran indisponible:', fullscreenError)
    }
  }

  if (loading) return <div className="state">Chargement...</div>
  if (error && !book) return <div className="state error">Erreur : {error}</div>
  if (!book) return <div className="state">Œuvre introuvable.</div>

  const isManga = String(book.category || '').toLowerCase().startsWith('manga •')
  const theme = isManga ? 'manga-reader' : 'books-reader'
  const backPath = isManga ? '/mangas' : '/livres'
  const typeLabel = isManga ? 'Manga' : 'Livre'
  const isFavorite = favorites.includes(id)
  const isBookmarked = Boolean(bookmarks[id])

  return (
    <main className={`reader ${theme} ${readingMode ? 'reading-mode-active' : ''}`}>
      <div className="reader-card">
        <div className={`reader-mode-bar ${readingMode ? 'is-active' : ''}`}>
          <div className="reader-mode-title"><span>📖</span><strong>{readingMode ? 'Mode lecture' : 'Lecture'}</strong><span>{progress}%</span></div>
          <div className="reader-mode-controls">
            <button type="button" className="reader-mode-control" onClick={toggleReadingMode}>{readingMode ? '☀️ Normal' : '🌙 Focus'}</button>
            <button type="button" className="reader-mode-control" onClick={toggleFullscreen}>{fullscreen ? '🗗 Quitter plein écran' : '⛶ Plein écran'}</button>
          </div>
        </div>
        <Link to={backPath} className="btn">← {isManga ? 'Mangathèque' : 'Bibliothèque'}</Link>
        {rewardNotice && <div className="reward-toast" role="status">{rewardNotice}<button type="button" onClick={() => setRewardNotice('')} aria-label="Fermer">×</button></div>}
        <h1>{book.title}</h1>
        <p className="reader-author">{book.author || (isManga ? 'Mangaka inconnu' : 'Auteur inconnu')} {book.category ? `• ${book.category}` : ''} • {book.is_free ? 'Gratuit' : 'Premium'}</p>
        <div className="reader-meta-strip"><span>👁️ {Number(book.views_count || 0) + 1} lecture(s)</span><span>⭐ {averageRating ? averageRating.toFixed(1) : '—'} / 5 ({ratingCount})</span><span>📖 {progress}% lu</span></div>
        <img className="reader-cover" src={book.cover_url || FALLBACK_COVER} alt={`Couverture de ${book.title}`} decoding="async" />
        {book.description && <p className="reader-description">{book.description}</p>}
        {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}
        <section className="reading-progress-panel">
          <div className="reading-progress-heading"><strong>📖 Ma progression</strong><span>{progress}%</span></div>
          <div className="reading-progress-track" aria-hidden="true"><div className="reading-progress-fill" style={{ width: `${progress}%` }} /></div>
          <input type="range" min="0" max="100" step="5" value={progress} onChange={e => saveProgress(e.target.value)} aria-label="Progression de lecture" />
          <small>Ta progression est enregistrée sur cet appareil.</small>
        </section>
        <div className="reader-actions">
          <button type="button" className={`btn ${isFavorite ? 'favorite-reading' : ''}`} onClick={toggleFavorite}>{isFavorite ? '❤️ Dans ma bibliothèque' : '♡ Ajouter à ma bibliothèque'}</button>
          <button type="button" className={`btn ${isBookmarked ? 'bookmark-reading' : ''}`} onClick={toggleBookmark}>{isBookmarked ? '🔖 Marqué' : '🔖 Marquer'}</button>
          <button type="button" className="btn" onClick={toggleReadingMode}>{readingMode ? '☀️ Mode normal' : '🌙 Mode lecture'}</button>
          {pdfUrl ? <><a className="btn primary" href={pdfUrl} target="_blank" rel="noreferrer">📖 Lire le {typeLabel}</a><a className="btn" href={pdfUrl} download>Télécharger</a></> : <span className="muted">Aucun PDF disponible.</span>}
        </div>
        <section className="rating-panel"><div><strong>⭐ Donner une note</strong><p className="muted">Ton pseudo est utilisé pour enregistrer ta note.</p></div><div className="stars">{[1,2,3,4,5].map(value => <button key={value} type="button" className={value <= rating ? 'star selected' : 'star'} onClick={() => submitRating(value)} disabled={ratingSending}>★</button>)}</div><small>{averageRating ? `Moyenne ${averageRating.toFixed(1)}/5 · ${ratingCount} note(s)` : 'Aucune note pour le moment'}</small></section>
        {pdfUrl && <iframe className="pdf-frame" src={pdfUrl} title={`Lecture de ${book.title}`} />}
        <section className="comments"><h2>💬 Commentaires</h2><p className="muted">Tu peux commenter sans créer de compte. Choisis simplement un pseudo.</p><form onSubmit={addComment} className="comment-form"><label htmlFor="comment-pseudo">Votre pseudo</label><input id="comment-pseudo" type="text" value={pseudo} onChange={e => setPseudo(e.target.value)} placeholder="Ex. Junior, Lecteur2026..." minLength="2" maxLength="30" autoComplete="nickname" required /><label htmlFor="comment-content">Votre commentaire</label><textarea id="comment-content" value={comment} onChange={e => setComment(e.target.value)} placeholder={`Écris ton commentaire sur ce ${isManga ? 'manga' : 'livre'}...`} rows="4" maxLength="2000" required /><button type="submit" className="btn primary" disabled={sending}>{sending ? 'Publication...' : '💬 Publier le commentaire'}</button></form><div className="comment-list">{comments.length === 0 ? <p className="muted">Aucun commentaire pour le moment. Sois le premier à commenter !</p> : comments.map(item => <article className="comment" key={item.id}><strong>{item.user_email || 'Lecteur'}</strong><p>{item.content}</p></article>)}</div></section>
      </div>
    </main>
  )
}
