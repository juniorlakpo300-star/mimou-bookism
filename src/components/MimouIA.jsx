import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'

const buttonStyle = {
  position: 'fixed',
  right: '24px',
  bottom: '24px',
  zIndex: 99999,
  border: 'none',
  borderRadius: '999px',
  padding: '14px 22px',
  color: '#fff',
  fontSize: '15px',
  fontWeight: 800,
  cursor: 'pointer',
  transition: 'transform .2s ease'
}

function normalize(text = '') {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export default function MimouIA() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [books, setBooks] = useState([])
  const [results, setResults] = useState([])
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Bonjour 👋 Je suis Lia, ton assistante intelligente de MIMOU BOOKISM. Pose-moi une question, demande-moi une recommandation ou cherche un livre.' }
  ])

  const storedTheme = typeof window !== 'undefined' ? localStorage.getItem('mimou_bookism_section') : ''
  const isAdmin = location.pathname.startsWith('/admin')
  const theme = isAdmin ? 'admin' : location.pathname.startsWith('/mangas') ? 'manga' : location.pathname.startsWith('/livres') || location.pathname.startsWith('/catalogue') ? 'books' : location.pathname.startsWith('/read/') && storedTheme === 'manga' ? 'manga' : location.pathname.startsWith('/read/') && storedTheme === 'books' ? 'books' : 'home'
  const avatar = theme === 'manga' ? '🎴' : theme === 'books' ? '📖' : theme === 'admin' ? '👩🏻' : '🤖'
  const title = theme === 'manga' ? 'Lia Manga' : theme === 'books' ? 'Lia Lecture' : theme === 'admin' ? 'Lia — Assistance admin' : 'Lia'
  const subtitle = theme === 'manga' ? 'Compagne de ta mangathèque' : theme === 'books' ? 'Gardienne de ta bibliothèque' : theme === 'admin' ? 'Besoin d’aide ? Je suis là.' : 'Intelligence de MIMOU BOOKISM'

  useEffect(() => {
    if (open) loadBooks()
  }, [open])

  async function loadBooks() {
    const allBooks = []
    const pageSize = 1000

    for (let from = 0; ; from += pageSize) {
      const { data, error: booksError } = await supabase
        .from('books')
        .select('id,title,author,category,description,cover_url')
        .order('title', { ascending: true })
        .range(from, from + pageSize - 1)

      if (booksError) {
        setError('Impossible de charger le catalogue de Lia.')
        return
      }

      allBooks.push(...(data || []))
      if (!data || data.length < pageSize) break
    }

    setBooks(allBooks)
  }

  function searchBooks(query) {
    const q = normalize(query).trim()
    if (!q) return []

    const words = q.split(/\s+/).filter((word) => word.length > 2)
    if (!words.length) return []

    return books
      .map((book) => {
        const text = normalize([book.title, book.author, book.category, book.description].filter(Boolean).join(' '))
        const score = words.reduce((total, word) => total + (text.includes(word) ? 1 : 0), 0)
        return { book, score }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.book)
  }

  async function sendMessage() {
    const text = message.trim()
    if (!text || loading) return

    setMessage('')
    setError('')
    setLoading(true)
    setMessages((prev) => [...prev, { role: 'user', content: text }])

    const found = searchBooks(text)
    setResults(found)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, books })
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || `Erreur du service IA (${response.status}).`)

      const reply = String(data.reply || '').trim()
      if (!reply) throw new Error('Lia n’a pas reçu de réponse.')

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(err?.message || 'Impossible de contacter Lia.')
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Désolée, je rencontre un petit problème. Réessaie dans un instant.' }])
    } finally {
      setLoading(false)
    }
  }

  const adminGuide = isAdmin ? (
    <div className="lia-admin-guide" aria-label="Lia vous aide dans l'administration">
      <div className="lia-admin-person">👩🏻</div>
      <div className="lia-admin-sign">TU AS BESOIN D’AIDE ?<br /><strong>CLIQUE SUR MOI !</strong></div>
    </div>
  ) : null

  return (
    <>
      {adminGuide}
      <button type="button" onClick={() => setOpen((value) => !value)} className={`lia-toggle ${theme}`} style={buttonStyle} aria-label="Ouvrir Lia">
        {open ? '✕ Fermer Lia' : `${avatar} ${title}`}
      </button>

      {open && (
        <div className={`lia-panel ${theme}`} style={{ position: 'fixed', right: '24px', bottom: '82px', zIndex: 99998, width: '390px', maxWidth: 'calc(100vw - 32px)', height: '620px', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #334155', borderRadius: '20px', color: '#fff', boxShadow: '0 25px 70px rgba(0,0,0,.55)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className={`lia-avatar ${theme}`}>{avatar}</div>
            <div>
              <div style={{ fontSize: '19px', fontWeight: 800 }}>{title}</div>
              <div style={{ marginTop: '5px', color: '#94a3b8', fontSize: '13px' }}>{subtitle}</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {messages.map((item, index) => (
              <div key={`${item.role}-${index}`} style={{ maxWidth: '85%', marginLeft: item.role === 'user' ? 'auto' : 0, marginBottom: '12px', padding: '11px 13px', borderRadius: '14px', background: item.role === 'user' ? (theme === 'manga' ? '#7c3aed' : theme === 'books' ? '#047857' : '#2563eb') : '#0f172a', border: item.role === 'user' ? 'none' : '1px solid #1e293b', lineHeight: 1.55, fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                {item.content}
              </div>
            ))}

            {loading && <div style={{ color: '#94a3b8', fontSize: '13px', padding: '8px' }}>Lia réfléchit…</div>}
            {error && <div style={{ color: '#f87171', fontSize: '12px', padding: '6px' }}>{error}</div>}

            {results.length > 0 && (
              <div style={{ marginTop: '18px' }}>
                <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 800, letterSpacing: '1px', marginBottom: '9px' }}>ŒUVRES CORRESPONDANTES</div>
                {results.map((book) => (
                  <Link key={book.id} to={`/read/${book.id}`} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px', padding: '9px', borderRadius: '12px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff' }}>
                    {book.cover_url && <img src={book.cover_url} alt="" style={{ width: '38px', height: '52px', objectFit: 'cover', borderRadius: '6px' }} />}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '13px' }}>{book.title}</div>
                      {book.author && <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '3px' }}>{book.author}</div>}
                      {book.category && <div style={{ color: theme === 'manga' ? '#c084fc' : theme === 'books' ? '#34d399' : '#60a5fa', fontSize: '11px', marginTop: '2px' }}>{book.category}</div>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={(event) => { event.preventDefault(); sendMessage() }} style={{ padding: '12px', borderTop: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage() } }} placeholder="Écris à Lia…" rows={2} disabled={loading} style={{ flex: 1, minWidth: 0, resize: 'none', border: '1px solid #334155', borderRadius: '11px', background: '#0f172a', color: '#fff', padding: '9px 11px', outline: 'none' }} />
              <button type="submit" disabled={loading || !message.trim()} style={{ alignSelf: 'flex-end', border: 'none', borderRadius: '11px', padding: '10px 13px', background: theme === 'manga' ? '#7c3aed' : theme === 'books' ? '#047857' : '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Envoyer</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
