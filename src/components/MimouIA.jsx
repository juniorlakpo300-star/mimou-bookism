import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'

const buttonStyle = {
  position: 'fixed', right: '24px', bottom: '24px', zIndex: 99999,
  border: 'none', borderRadius: '999px', padding: '14px 22px', color: '#fff',
  fontSize: '15px', fontWeight: 800, cursor: 'pointer', transition: 'transform .2s ease'
}

function normalize(text = '') {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[!?.,;:]+/g, '').trim()
}

export default function MimouIA() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [catalogueLoading, setCatalogueLoading] = useState(false)
  const [dictionaryLoading, setDictionaryLoading] = useState(false)
  const [error, setError] = useState('')
  const [books, setBooks] = useState([])
  const [dictionary, setDictionary] = useState([])
  const [results, setResults] = useState([])
  const [dictionaryResults, setDictionaryResults] = useState([])
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
    if (open && books.length === 0 && !catalogueLoading) loadBooks()
    if (open && dictionary.length === 0 && !dictionaryLoading) loadDictionary()
  }, [open, books.length, dictionary.length, catalogueLoading, dictionaryLoading])

  async function loadBooks() {
    setCatalogueLoading(true)
    try {
      const allBooks = []
      const pageSize = 1000
      for (let from = 0; ; from += pageSize) {
        const { data, error: booksError } = await supabase.from('books').select('id,title,author,category,description,cover_url').order('title', { ascending: true }).range(from, from + pageSize - 1)
        if (booksError) throw booksError
        allBooks.push(...(data || []))
        if (!data || data.length < pageSize) break
      }
      setBooks(allBooks)
    } catch (loadError) {
      console.error('Erreur catalogue Lia:', loadError)
      setError('Impossible de charger le catalogue de Lia.')
    } finally {
      setCatalogueLoading(false)
    }
  }

  async function loadDictionary() {
    setDictionaryLoading(true)
    try {
      const { data, error: dictionaryError } = await supabase.from('dictionary_entries').select('id,word,type,definition,example,tags').order('word', { ascending: true })
      if (dictionaryError) {
        console.warn('Dictionnaire Supabase indisponible pour Lia:', dictionaryError)
        return
      }
      setDictionary(Array.isArray(data) ? data : [])
    } catch (dictionaryError) {
      console.warn('Erreur dictionnaire Lia:', dictionaryError)
    } finally {
      setDictionaryLoading(false)
    }
  }

  function searchBooks(query) {
    const q = normalize(query)
    if (!q) return []
    const words = q.split(/\s+/).filter((word) => word.length > 2)
    if (!words.length) return []
    return books.map((book) => {
      const title = normalize(book.title), author = normalize(book.author), category = normalize(book.category), description = normalize(book.description)
      const score = words.reduce((total, word) => total + (title.includes(word) ? 4 : 0) + (author.includes(word) ? 3 : 0) + (category.includes(word) ? 2 : 0) + (description.includes(word) ? 1 : 0), 0)
      return { book, score }
    }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || String(a.book.title).localeCompare(String(b.book.title))).slice(0, 3).map((item) => item.book)
  }

  function searchDictionary(query) {
    const q = normalize(query)
    if (!q || !dictionary.length) return []
    const words = q.split(/\s+/).filter((word) => word.length > 2)
    return dictionary.map((entry) => {
      const word = normalize(entry.word), definition = normalize(entry.definition), example = normalize(entry.example), tags = normalize(Array.isArray(entry.tags) ? entry.tags.join(' ') : '')
      const score = words.reduce((total, part) => total + (word === part ? 8 : word.includes(part) ? 5 : 0) + (definition.includes(part) ? 2 : 0) + (example.includes(part) ? 1 : 0) + (tags.includes(part) ? 1 : 0), 0)
      return { entry, score }
    }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 3).map((item) => item.entry)
  }

  function getQuickReply(text, dictionaryFound) {
    const normalized = normalize(text)
    if (/^(bonjour|bonsoir|salut|hello|hey|coucou|bjr|slt)$/.test(normalized)) return 'Bonjour 👋 ! Comment puis-je t’aider aujourd’hui ?'
    if (dictionaryFound.length) return `📖 J’ai trouvé ${dictionaryFound.length > 1 ? 'des explications' : 'une explication'} dans le dictionnaire. Tu peux ouvrir l’entrée ci-dessous pour la consulter.`
    if (/\b(dictionnaire|mot difficile|definition|definir|terme japonais|terme manga)\b/.test(normalized)) return 'Bien sûr 📖 ! Tu peux consulter le Dictionnaire MIMOU BOOKISM pour comprendre les mots difficiles et les termes manga/japonais.'
    if (/\b(manga|mangas)\b/.test(normalized) && !/\b(livre|livres)\b/.test(normalized)) return '🎴 Tu peux découvrir la mangathèque directement depuis la page Mangas.'
    if (/\b(livre|livres|bibliotheque|bibliothèque)\b/.test(normalized) && !/\b(manga|mangas)\b/.test(normalized)) return '📚 Tu peux parcourir tous les livres disponibles dans la bibliothèque MIMOU BOOKISM.'
    return ''
  }

  async function sendMessage() {
    const text = message.trim().slice(0, 1200)
    if (!text || loading) return
    setMessage(''); setError(''); setLoading(true)
    setMessages((prev) => [...prev, { role: 'user', content: text }])

    const found = searchBooks(text)
    const dictionaryFound = searchDictionary(text)
    setResults(found)
    setDictionaryResults(dictionaryFound)

    const quickReply = getQuickReply(text, dictionaryFound)
    if (quickReply) {
      setMessages((prev) => [...prev, { role: 'assistant', content: quickReply }])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 25000)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, books, dictionary }), signal: controller.signal
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || `Erreur du service IA (${response.status}).`)
      const reply = String(data.reply || '').trim()
      if (!reply) throw new Error('Lia n’a pas reçu de réponse.')
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      const errorMessage = err?.name === 'AbortError' ? 'Lia met trop de temps à répondre. Réessaie dans quelques secondes.' : err?.message || 'Impossible de contacter Lia.'
      setError(errorMessage)
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Désolée, je rencontre un petit problème. Tu peux réessayer dans un instant.' }])
    } finally {
      window.clearTimeout(timeout); setLoading(false)
    }
  }

  const adminGuide = isAdmin ? (
    <div className="lia-admin-guide" aria-label="Lia vous aide dans l'administration" style={{ position: 'fixed', right: '28px', bottom: '92px', zIndex: 99997, display: 'flex', alignItems: 'flex-end', gap: '10px', pointerEvents: 'none', animation: 'liaGuideFloat 3s ease-in-out infinite' }}>
      <div className="lia-admin-person" style={{ fontSize: '76px', lineHeight: 1, filter: 'drop-shadow(0 12px 20px rgba(0,0,0,.35))' }}>👩🏻</div>
      <div className="lia-admin-sign" style={{ pointerEvents: 'auto', cursor: 'pointer', padding: '13px 17px', borderRadius: '14px', border: '3px solid #f8fafc', background: 'linear-gradient(145deg,#7c3aed,#ec4899)', color: '#fff', fontSize: '12px', lineHeight: 1.35, fontWeight: 900, letterSpacing: '.7px', textAlign: 'center', boxShadow: '0 12px 30px rgba(124,58,237,.35)', transform: 'rotate(-3deg)', minWidth: '150px' }} onClick={() => setOpen(true)}>
        TU AS BESOIN D’AIDE ?<br /><strong style={{ fontSize: '15px' }}>CLIQUE SUR MOI !</strong>
      </div>
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
            <div><div style={{ fontSize: '19px', fontWeight: 800 }}>{title}</div><div style={{ marginTop: '5px', color: '#94a3b8', fontSize: '13px' }}>{subtitle}</div></div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {messages.map((item, index) => <div key={`${item.role}-${index}`} style={{ maxWidth: '85%', marginLeft: item.role === 'user' ? 'auto' : 0, marginBottom: '12px', padding: '11px 13px', borderRadius: '14px', background: item.role === 'user' ? (theme === 'manga' ? '#7c3aed' : theme === 'books' ? '#047857' : '#2563eb') : '#0f172a', border: item.role === 'user' ? 'none' : '1px solid #1e293b', lineHeight: 1.55, fontSize: '14px', whiteSpace: 'pre-wrap' }}>{item.content}</div>)}
            {catalogueLoading && <div style={{ color: '#94a3b8', fontSize: '13px', padding: '8px' }}>Lia prépare le catalogue…</div>}
            {dictionaryLoading && <div style={{ color: '#94a3b8', fontSize: '13px', padding: '8px' }}>Lia prépare le dictionnaire…</div>}
            {loading && <div style={{ color: '#94a3b8', fontSize: '13px', padding: '8px' }}>Lia réfléchit…</div>}
            {error && <div style={{ color: '#f87171', fontSize: '12px', padding: '6px' }}>{error}</div>}

            {dictionaryResults.length > 0 && <div style={{ marginTop: '18px' }}><div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 800, letterSpacing: '1px', marginBottom: '9px' }}>📖 EXPLICATIONS DU DICTIONNAIRE</div>{dictionaryResults.map((entry) => <Link key={entry.id || entry.word} to="/dictionnaire" style={{ display: 'block', marginBottom: '8px', padding: '10px', borderRadius: '12px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff' }}><div style={{ fontWeight: 800, fontSize: '14px' }}>{entry.word}</div><div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '3px' }}>{entry.type}</div><div style={{ color: '#e2e8f0', fontSize: '12px', marginTop: '6px', lineHeight: 1.45 }}>{entry.definition}</div></Link>)}</div>}

            {results.length > 0 && <div style={{ marginTop: '18px' }}><div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 800, letterSpacing: '1px', marginBottom: '9px' }}>ŒUVRES CORRESPONDANTES</div>{results.map((book) => <Link key={book.id} to={`/read/${book.id}`} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px', padding: '9px', borderRadius: '12px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff' }}>{book.cover_url && <img src={book.cover_url} alt="" loading="lazy" style={{ width: '38px', height: '52px', objectFit: 'cover', borderRadius: '6px' }} />}<div style={{ minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: '13px' }}>{book.title}</div>{book.author && <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '3px' }}>{book.author}</div>}{book.category && <div style={{ color: theme === 'manga' ? '#c084fc' : theme === 'books' ? '#34d399' : '#60a5fa', fontSize: '11px', marginTop: '2px' }}>{book.category}</div>}</div></Link>)}</div>}
          </div>
          <form onSubmit={(event) => { event.preventDefault(); sendMessage() }} style={{ padding: '12px', borderTop: '1px solid #1e293b' }}><div style={{ display: 'flex', gap: '8px' }}><textarea value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage() } }} placeholder="Écris à Lia…" rows={2} maxLength={1200} disabled={loading} style={{ flex: 1, minWidth: 0, resize: 'none', border: '1px solid #334155', borderRadius: '11px', background: '#0f172a', color: '#fff', padding: '9px 11px', outline: 'none' }} /><button type="submit" disabled={loading || !message.trim()} style={{ alignSelf: 'flex-end', border: 'none', borderRadius: '11px', padding: '10px 13px', background: theme === 'manga' ? '#7c3aed' : theme === 'books' ? '#047857' : '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Envoyer</button></div></form>
        </div>
      )}
    </>
  )
}
