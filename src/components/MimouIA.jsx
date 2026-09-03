import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase.js'

export default function MimouIA() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Bonjour 👋 Je suis Lia, ton assistante intelligente de MIMOU BOOKISM. Pose-moi une question, demande-moi une recommandation ou cherche un livre."
    }
  ])
  const [loading, setLoading] = useState(false)
  const [books, setBooks] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState('')

  async function searchBooks(query) {
    const text = query.trim()
    if (!text) return

    setSearchLoading(true)
    setBooks([])

    const safeQuery = text.slice(0, 120).replace(/[%_,]/g, ' ')

    const { data, error: searchError } = await supabase
      .from('books')
      .select('id, title, author, category, description, cover_url, is_free')
      .or(
        `title.ilike.%${safeQuery}%,author.ilike.%${safeQuery}%,category.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`
      )
      .limit(3)

    if (searchError) {
      setError('Impossible de rechercher les livres.')
    } else if (!data || data.length === 0) {
      setError('Je n’ai trouvé aucun livre correspondant.')
    } else {
      setBooks(data)
    }

    setSearchLoading(false)
  }

  async function sendMessage() {
    const text = message.trim()
    if (!text || loading) return

    setMessage('')
    setError('')
    setBooks([])

    const assistantIndex = messages.length + 1

    setMessages(prev => [
      ...prev,
      { role: 'user', content: text },
      { role: 'assistant', content: '' }
    ])
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || `Erreur du service IA (${response.status}).`)
      }

      const reply = typeof data.reply === 'string' ? data.reply.trim() : ''

      if (!reply) {
        throw new Error('Lia n’a reçu aucune réponse du service IA.')
      }

      setMessages(prev =>
        prev.map((item, index) =>
          index === assistantIndex
            ? { ...item, content: reply }
            : item
        )
      )

      setLoading(false)

      const lowerText = text.toLowerCase()
      const wantsBook =
        lowerText.includes('livre') ||
        lowerText.includes('roman') ||
        lowerText.includes('auteur') ||
        lowerText.includes('lecture') ||
        lowerText.includes('business') ||
        lowerText.includes('amour') ||
        lowerText.includes('science') ||
        lowerText.includes('développement')

      if (wantsBook) {
        searchBooks(text)
      }
    } catch (err) {
      console.error('Erreur Lia:', err)
      setError(err.message || 'Erreur inconnue.')
      setMessages(prev =>
        prev.map((item, index) =>
          index === assistantIndex
            ? {
                ...item,
                content:
                  'Désolée 😕 Je rencontre actuellement un problème pour me connecter au service IA.'
              }
            : item
        )
      )
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function clearConversation() {
    setMessages([
      {
        role: 'assistant',
        content: 'Bonjour 👋 Je suis Lia. Comment puis-je t’aider aujourd’hui ?'
      }
    ])
    setBooks([])
    setError('')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-label="Ouvrir Lia"
        style={{
          position: 'fixed', right: '24px', bottom: '24px', zIndex: 99999,
          display: 'flex', alignItems: 'center', gap: '9px', padding: '13px 19px',
          border: '1px solid #475569', borderRadius: '999px', background: '#111827',
          color: '#ffffff', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
          boxShadow: '0 15px 40px rgba(0,0,0,0.5)'
        }}
      >
        <span style={{
          width: '28px', height: '28px', borderRadius: '50%', background: '#ffffff',
          color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: '900'
        }}>✦</span>
        Lia
      </button>

      {open && (
        <section style={{
          position: 'fixed', right: '24px', bottom: '82px', zIndex: 99998,
          width: '390px', maxWidth: 'calc(100vw - 30px)', height: '560px',
          maxHeight: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column',
          background: '#0b1220', color: '#e2e8f0', border: '1px solid #334155',
          borderRadius: '20px', overflow: 'hidden', boxShadow: '0 25px 70px rgba(0,0,0,0.65)'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '16px',
            background: '#111827', borderBottom: '1px solid #1e293b'
          }}>
            <div style={{
              width: '42px', height: '42px', flexShrink: 0, borderRadius: '50%',
              background: '#ffffff', color: '#0f172a', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: '900'
            }}>L</div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <strong style={{ color: '#ffffff', fontSize: '15px' }}>Lia</strong>
              <span style={{ color: '#94a3b8', fontSize: '11px' }}>
                Intelligence de MIMOU BOOKISM
              </span>
            </div>

            <button type="button" onClick={clearConversation} title="Nouvelle conversation" style={{
              border: 'none', background: 'transparent', color: '#94a3b8', fontSize: '18px',
              cursor: 'pointer', padding: '5px'
            }}>↻</button>

            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer Lia" style={{
              border: 'none', background: 'transparent', color: '#94a3b8', fontSize: '25px',
              cursor: 'pointer', padding: '2px'
            }}>×</button>
          </div>

          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px', display: 'flex',
            flexDirection: 'column', gap: '12px'
          }}>
            {messages.map((item, index) => (
              <div key={`${item.role}-${index}`} style={{
                display: 'flex',
                justifyContent: item.role === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  maxWidth: '84%', padding: '11px 13px',
                  borderRadius: item.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: item.role === 'user' ? '#1e293b' : '#111827',
                  border: item.role === 'user' ? '1px solid #334155' : '1px solid #1e293b',
                  color: '#f8fafc', fontSize: '13px', lineHeight: '1.55', whiteSpace: 'pre-wrap',
                  minHeight: item.content ? undefined : '22px'
                }}>
                  {item.content || (index === messages.length - 1 && loading ? 'Lia écrit...' : '')}
                </div>
              </div>
            ))}

            {searchLoading && (
              <div style={{ color: '#64748b', fontSize: '11px', paddingLeft: '4px' }}>
                Recherche de livres...
              </div>
            )}

            {error && (
              <div style={{
                color: '#fca5a5', fontSize: '12px', padding: '8px 10px',
                background: '#1f1720', borderRadius: '10px'
              }}>{error}</div>
            )}

            {books.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                <span style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: '700' }}>
                  📚 Livres trouvés
                </span>

                {books.map(book => (
                  <article key={book.id} style={{
                    display: 'flex', gap: '11px', padding: '10px',
                    border: '1px solid #1e293b', borderRadius: '13px', background: '#111827'
                  }}>
                    <img
                      src={book.cover_url || 'https://placehold.co/80x110/111827/94a3b8?text=BOOK'}
                      alt={`Couverture de ${book.title}`}
                      style={{ width: '48px', height: '68px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <strong style={{ color: '#ffffff', fontSize: '12px' }}>{book.title}</strong>
                      <span style={{ color: '#94a3b8', fontSize: '11px' }}>{book.author || 'Auteur inconnu'}</span>
                      <small style={{ color: '#64748b', fontSize: '10px' }}>{book.category || 'Sans catégorie'}</small>
                      <Link to={`/read/${book.id}`} onClick={() => setOpen(false)} style={{
                        color: '#ffffff', fontSize: '10px', fontWeight: '700', marginTop: '3px', textDecoration: 'none'
                      }}>Ouvrir le livre →</Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: '12px', background: '#111827', borderTop: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Écris à Lia..."
                rows={1}
                disabled={loading}
                style={{
                  flex: 1, minWidth: 0, resize: 'none', padding: '11px 12px',
                  border: '1px solid #334155', borderRadius: '12px', background: '#020617',
                  color: '#ffffff', outline: 'none', fontFamily: 'inherit', fontSize: '13px', lineHeight: '1.4'
                }}
              />
              <button type="button" onClick={sendMessage} disabled={loading || !message.trim()} style={{
                width: '43px', height: '43px', flexShrink: 0, border: 'none', borderRadius: '12px',
                background: loading || !message.trim() ? '#334155' : '#ffffff', color: '#0f172a',
                fontSize: '19px', fontWeight: '900', cursor: loading || !message.trim() ? 'not-allowed' : 'pointer'
              }}>↑</button>
            </div>
            <div style={{ marginTop: '7px', color: '#64748b', fontSize: '9px', textAlign: 'center' }}>
              Lia • MIMOU BOOKISM
            </div>
          </div>
        </section>
      )}
    </>
  )
}
