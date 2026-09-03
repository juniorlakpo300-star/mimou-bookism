import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'

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

      const localResults = searchLocalBooks(text)
      if (localResults.length) setBooks(localResults)
    } catch (err) {
      setError(err?.message || 'Impossible de contacter Lia.')
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Désolée, je rencontre un petit problème. Réessaie dans un instant.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-indigo-600 px-5 py-3 font-semibold text-white shadow-xl transition hover:bg-indigo-500"
      >
        {open ? 'Fermer Lia' : 'Lia'}
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 z-50 flex h-[620px] w-[390px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-white shadow-2xl">
          <div className="border-b border-slate-800 px-5 py-4">
            <h2 className="text-lg font-bold">Lia</h2>
            <p className="text-sm text-slate-400">Intelligence de MIMOU BOOKISM</p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((item, index) => (
              <div key={`${item.role}-${index}`} className={item.role === 'user' ? 'ml-8 rounded-xl bg-indigo-600 p-3' : 'mr-8 rounded-xl bg-slate-800 p-3'}>
                <p className="whitespace-pre-wrap text-sm leading-6">{item.content}</p>
              </div>
            ))}

            {loading && <div className="mr-8 rounded-xl bg-slate-800 p-3 text-sm text-slate-400">Lia réfléchit…</div>}

            {error && <p className="px-2 text-xs text-red-400">{error}</p>}

            {books.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Livres du catalogue</p>
                {books.slice(0, 3).map((book) => (
                  <Link key={book.id} to={`/livre/${book.id}`} className="flex gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3 transition hover:border-indigo-500">
                    {book.cover_url && <img src={book.cover_url} alt="" className="h-14 w-10 rounded object-cover" />}
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{book.title}</p>
                      {book.author && <p className="truncate text-xs text-slate-400">{book.author}</p>}
                      {book.category && <p className="truncate text-xs text-indigo-300">{book.category}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={(event) => { event.preventDefault(); sendMessage() }} className="border-t border-slate-800 p-3">
            <div className="flex gap-2">
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
                className="min-w-0 flex-1 resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
              <button type="submit" disabled={loading || !message.trim()} className="self-end rounded-xl bg-indigo-600 px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50">
                Envoyer
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
