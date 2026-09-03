import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'

const buttonStyle = {
  position: 'fixed',
  right: '24px',
  bottom: '24px',
  zIndex: 99999,
  border: 'none',
  borderRadius: '999px',
  padding: '14px 22px',
  background: '#2563eb',
  color: '#fff',
  fontSize: '15px',
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: '0 12px 35px rgba(37, 99, 235, 0.45)'
}

export default function MimouIA() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [books, setBooks] = useState([])
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Bonjour 👋 Je suis Lia, ton assistante intelligente de MIMOU BOOKISM. Pose-moi une question, demande-moi une recommandation ou cherche un livre.' }
  ])

  useEffect(() => {
    if (open) loadBooks()
  }, [open])

  async function loadBooks() {
    const { data, error: booksError } = await supabase
      .from('books')
      .select('id,title,author,category,description,cover_url')
      .order('title', { ascending: true })
      .limit(100)

    if (!booksError) setBooks(data || [])
  }

  function searchLocalBooks(query) {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    if (!words.length) return []

    return books.filter((book) => {
      const text = [book.title, book.author, book.category, book.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return words.some((word) => text.includes(word))
    }).slice(0, 3)
  }

  async function sendMessage() {
    const text = message.trim()
    if (!text || loading) return

    setMessage('')
    setError('')
    setLoading(true)
    setMessages((prev) => [...prev, { role: 'user', content: text }])

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

  const relevantBooks = searchLocalBooks(message)

  return (
    <>
      <button type="button" onClick={() => setOpen((value) => !value)} style={buttonStyle} aria-label="Ouvrir Lia">
        {open ? '✕ Fermer Lia' : '🤖 Lia'}
      </button>

      {open && (
        <div style={{
          position: 'fixed', right: '24px', bottom: '82px', zIndex: 99998,
          width: '390px', maxWidth: 'calc(100vw - 32px)', height: '620px',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: '1px solid #334155', borderRadius: '20px',
          background: '#020617', color: '#fff', boxShadow: '0 25px 70px rgba(0,0,0,.55)'
        }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ fontSize: '19px', fontWeight: 800 }}>🤖 Lia</div>
            <div style={{ marginTop: '5px', color: '#94a3b8', fontSize: '13px' }}>Intelligence de MIMOU BOOKISM</div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {messages.map((item, index) => (
              <div key={`${item.role}-${index}`} style={{
                maxWidth: '85%', marginLeft: item.role === 'user' ? 'auto' : 0,
                marginBottom: '12px', padding: '11px 13px', borderRadius: '14px',
                background: item.role === 'user' ? '#2563eb' : '#0f172a',
                border: item.role === 'user' ? 'none' : '1px solid #1e293b',
                lineHeight: 1.55, fontSize: '14px', whiteSpace: 'pre-wrap'
              }}>
                {item.content}
              </div>
            ))}

            {loading && <div style={{ color: '#94a3b8', fontSize: '13px', padding: '8px' }}>Lia réfléchit…</div>}
            {error && <div style={{ color: '#f87171', fontSize: '12px', padding: '6px' }}>{error}</div>}

            {books.length > 0 && (
              <div style={{ marginTop: '18px' }}>
                <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 800, letterSpacing: '1px', marginBottom: '9px' }}>LIVRES DU CATALOGUE</div>
                {books.slice(0, 3).map((book) => (
                  <Link key={book.id} to={`/read/${book.id}`} style={{
                    display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px',
                    padding: '9px', borderRadius: '12px', background: '#0f172a',
                    border: '1px solid #1e293b', color: '#fff'
                  }}>
                    {book.cover_url && <img src={book.cover_url} alt="" style={{ width: '38px', height: '52px', objectFit: 'cover', borderRadius: '6px' }} />}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '13px' }}>{book.title}</div>
                      {book.author && <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '3px' }}>{book.author}</div>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={(event) => { event.preventDefault(); sendMessage() }} style={{ padding: '12px', borderTop: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="Écris à Lia…"
                rows={2}
                disabled={loading}
                style={{ flex: 1, minWidth: 0, resize: 'none', border: '1px solid #334155', borderRadius: '11px', background: '#0f172a', color: '#fff', padding: '9px 11px', outline: 'none' }}
              />
              <button type="submit" disabled={loading || !message.trim()} style={{ alignSelf: 'flex-end', border: 'none', borderRadius: '11px', padding: '10px 13px', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                Envoyer
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
