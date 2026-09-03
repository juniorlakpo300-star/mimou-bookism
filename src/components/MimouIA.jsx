import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase.js'

export default function MimouIA() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function search() {
    const query = q.trim()

    if (!query) {
      setError('Écris ce que tu recherches.')
      return
    }

    setLoading(true)
    setError('')
    setBooks([])

    const safeQuery = query.replace(/[%_,]/g, ' ')

    const { data, error: searchError } = await supabase
      .from('books')
      .select(
        'id, title, author, category, description, cover_url, is_free'
      )
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

    setLoading(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      search()
    }
  }

  return (
    <>
      {/* BOUTON LIA */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        style={{
          position: 'fixed',
          right: '24px',
          bottom: '24px',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          padding: '13px 19px',
          border: '1px solid #475569',
          borderRadius: '999px',
          background: '#111827',
          color: '#ffffff',
          fontSize: '15px',
          fontWeight: '700',
          cursor: 'pointer',
          boxShadow: '0 15px 40px rgba(0,0,0,0.5)'
        }}
      >
        <span
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: '#ffffff',
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✦
        </span>

        Lia
      </button>

      {/* FENÊTRE LIA */}
      {open && (
        <section
          style={{
            position: 'fixed',
            right: '24px',
            bottom: '82px',
            zIndex: 99998,
            width: '370px',
            maxWidth: 'calc(100vw - 30px)',
            background: '#0b1220',
            color: '#e2e8f0',
            border: '1px solid #334155',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 25px 70px rgba(0,0,0,0.6)'
          }}
        >
          {/* HEADER */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '17px',
              background: '#111827',
              borderBottom: '1px solid #1e293b'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: '#ffffff',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800'
              }}
            >
              L
            </div>

            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '3px'
              }}
            >
              <strong style={{ color: '#ffffff' }}>
                Lia
              </strong>

              <span
                style={{
                  color: '#94a3b8',
                  fontSize: '11px'
                }}
              >
                Assistante MIMOU BOOKISM
              </span>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#94a3b8',
                fontSize: '25px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>

          {/* CONTENU */}
          <div style={{ padding: '18px' }}>
            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px'
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  flexShrink: 0,
                  borderRadius: '50%',
                  background: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800'
                }}
              >
                L
              </div>

              <div>
                <p
                  style={{
                    margin: '0 0 5px',
                    color: '#ffffff',
                    fontWeight: '700'
                  }}
                >
                  Bonjour 👋
                </p>

                <span
                  style={{
                    color: '#94a3b8',
                    fontSize: '13px',
                    lineHeight: '1.5'
                  }}
                >
                  Je suis Lia. Je peux t’aider à trouver
                  un livre dans MIMOU BOOKISM.
                </span>
              </div>
            </div>

            <label
              htmlFor="lia-search"
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#cbd5e1',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              Que recherches-tu ?
            </label>

            <div
              style={{
                display: 'flex',
                gap: '8px'
              }}
            >
              <input
                id="lia-search"
                type="text"
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Roman, business, amour..."
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '12px',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  background: '#020617',
                  color: '#ffffff',
                  outline: 'none'
                }}
              />

              <button
                type="button"
                onClick={search}
                disabled={loading}
                style={{
                  width: '45px',
                  border: 'none',
                  borderRadius: '12px',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontSize: '20px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {loading ? '...' : '→'}
              </button>
            </div>

            {error && (
              <p
                style={{
                  color: '#fca5a5',
                  fontSize: '12px',
                  marginTop: '12px'
                }}
              >
                {error}
              </p>
            )}

            {books.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <p
                  style={{
                    color: '#cbd5e1',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}
                >
                  Voici ce que j’ai trouvé :
                </p>

                {books.map(book => (
                  <article
                    key={book.id}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '11px',
                      marginTop: '9px',
                      border: '1px solid #1e293b',
                      borderRadius: '14px',
                      background: '#111827'
                    }}
                  >
                    <img
                      src={
                        book.cover_url ||
                        'https://placehold.co/80x110/111827/94a3b8?text=BOOK'
                      }
                      alt={`Couverture de ${book.title}`}
                      style={{
                        width: '52px',
                        height: '72px',
                        objectFit: 'cover',
                        borderRadius: '7px'
                      }}
                    />

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <strong style={{ color: '#ffffff' }}>
                        {book.title}
                      </strong>

                      <span
                        style={{
                          color: '#94a3b8',
                          fontSize: '11px'
                        }}
                      >
                        {book.author || 'Auteur inconnu'}
                      </span>

                      <small
                        style={{
                          color: '#64748b'
                        }}
                      >
                        {book.category || 'Sans catégorie'}
                      </small>

                      <Link
                        to={`/read/${book.id}`}
                        onClick={() => setOpen(false)}
                        style={{
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: '700',
                          marginTop: '4px'
                        }}
                      >
                        Lire le livre →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </>
  )
}