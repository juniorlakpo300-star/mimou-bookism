import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase.js'

const FAVORITES_KEY = 'mimou_bookism_favorites'
const LAST_READ_KEY = 'mimou_bookism_last_read'
const BOOKMARKS_KEY = 'mimou_bookism_bookmarks'
const PROGRESS_KEY = 'mimou_bookism_reading_progress'
const VISIT_KEY = 'mimou_bookism_last_visit'
const FALLBACK_COVER = 'https://placehold.co/400x560/0f172a/94a3b8?text=MIMOU+BOOKISM'

function readIds(key) { try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] } }
function readObject(key) { try { return JSON.parse(localStorage.getItem(key) || '{}') } catch { return {} } }

export default function Decouvrir() {
  const [works, setWorks] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRead, setLastRead] = useState(null)
  const [newSinceVisit, setNewSinceVisit] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const favoriteIds = readIds(FAVORITES_KEY)
  const bookmarks = readObject(BOOKMARKS_KEY)

  useEffect(() => {
    const saved = localStorage.getItem(LAST_READ_KEY)
    if (saved) try { setLastRead(JSON.parse(saved)) } catch {}
    const previousVisit = Number(localStorage.getItem(VISIT_KEY) || 0)
    async function load() {
      const { data, error } = await supabase.from('books').select('id,title,author,category,description,cover_url,created_at,views_count,is_free').order('created_at', { ascending: false })
      if (!error) {
        setWorks(data || [])
        setNewSinceVisit(previousVisit ? (data || []).filter(w => new Date(w.created_at).getTime() > previousVisit).length : 0)
      }
      localStorage.setItem(VISIT_KEY, String(Date.now()))
      setLoading(false)
    }
    load()
  }, [])

  const newest = works.slice(0, 6)
  const trends = useMemo(() => [...works].sort((a,b) => Number(b.views_count || 0) - Number(a.views_count || 0)).slice(0, 5), [works])
  const favorites = useMemo(() => favoriteIds.map(id => works.find(work => work.id === id)).filter(Boolean), [works, favoriteIds])
  const savedBookmarks = useMemo(() => Object.values(bookmarks).map(item => works.find(work => work.id === item.id) || item).filter(Boolean), [works, bookmarks])
  const readCount = Number(localStorage.getItem('mimou_bookism_read_count') || 0)
  const badgeCount = [readCount >= 1, readCount >= 5, favoriteIds.length >= 5, favoriteIds.length >= 10, works.some(w => String(w.category || '').toLowerCase().startsWith('manga •'))].filter(Boolean).length
  const isManga = work => String(work?.category || '').toLowerCase().startsWith('manga •')
  const typeLabel = work => isManga(work) ? '🗯️ MANGA' : '📚 LIVRE'
  const progress = Number(readObject(PROGRESS_KEY)[lastRead?.id] || lastRead?.progress || 0)

  if (loading) return <div className="state">Préparation de la découverte...</div>

  return (
    <main className="page discover-page">
      <div className="container">
        <header className="header">
          <Link to="/" className="brand">MIMOU <span>BOOKISM</span></Link>
          <nav className="nav">
            <Link to="/livres" className="btn">📚 Livres</Link><Link to="/mangas" className="btn">🗯️ Mangas</Link><Link to="/decouvrir" className="btn active">🔥 Découvrir</Link><Link to="/favoris" className="btn">❤️ Ma bibliothèque</Link>
          </nav>
        </header>

        <section className="discover-hero">
          <div><p className="eyebrow">MIMOU BOOKISM · DISCOVERY</p><h1>Trouve ta prochaine histoire.</h1><p>Les nouveautés, les tendances, ta reprise de lecture et tes œuvres sauvegardées réunis au même endroit.</p></div>
          <div className="discover-orbit">✦</div>
        </section>

        <section className="discover-notification-bar">
          <button type="button" className="notification-button" onClick={() => setShowNotifications(v => !v)}>🔔 Notifications {newSinceVisit > 0 && <b>{newSinceVisit}</b>}</button>
          {showNotifications && <div className="notification-popover"><strong>Depuis ta dernière visite</strong>{newSinceVisit ? <p>🆕 {newSinceVisit} nouvelle{newSinceVisit > 1 ? 's' : ''} publication{newSinceVisit > 1 ? 's' : ''} à découvrir.</p> : <p>Tu es à jour. Rien de nouveau pour le moment.</p>}</div>}
        </section>

        {lastRead && works.some(work => work.id === lastRead.id) && <section className="continue-card"><div className="continue-cover"><img src={lastRead.cover_url || FALLBACK_COVER} alt="" loading="lazy" /></div><div><span className="section-kicker">REPRENDRE MA LECTURE</span><h2>{lastRead.title}</h2><p>Continue ton aventure là où tu t'es arrêté.</p><div className="continue-progress"><div className="continue-progress-heading"><span>Progression</span><strong>{progress}%</strong></div><div className="continue-progress-track" aria-hidden="true"><div className="continue-progress-fill" style={{ width: `${progress}%` }} /></div></div><Link to={`/read/${lastRead.id}`} className="btn primary">📖 Continuer</Link></div></section>}

        <section className="discover-section"><div className="discover-heading"><div><span>🔥 TENDANCES</span><h2>Les œuvres les plus lues</h2></div><span>Top {trends.length}</span></div>{trends.length ? <div className="discover-grid">{trends.map((work,index) => <Link key={work.id} to={`/read/${work.id}`} className="discover-card"><div className="discover-cover"><img src={work.cover_url || FALLBACK_COVER} alt="" loading="lazy" onError={e => { e.currentTarget.src = FALLBACK_COVER }} /><span>#{index + 1} · {typeLabel(work)}</span></div><div className="discover-info"><h3>{work.title || 'Sans titre'}</h3><p>{work.author || 'Auteur inconnu'} · 👁️ {Number(work.views_count || 0)} lecture(s)</p></div></Link>)}</div> : <div className="empty-card"><p>Les tendances apparaîtront après les premières lectures.</p></div>}</section>

        <section className="discover-section"><div className="discover-heading"><div><span>NOUVEAUTÉS</span><h2>Les dernières publications</h2></div><span>{newest.length} œuvres</span></div>{newest.length === 0 ? <div className="empty-card"><h2>Pas encore de publication</h2></div> : <div className="discover-grid">{newest.map(work => <Link key={work.id} to={`/read/${work.id}`} className="discover-card"><div className="discover-cover"><img src={work.cover_url || FALLBACK_COVER} alt={`Couverture de ${work.title || 'œuvre'}`} loading="lazy" onError={e => { e.currentTarget.src = FALLBACK_COVER }} /><span>{typeLabel(work)}</span></div><div className="discover-info"><h3>{work.title || 'Sans titre'}</h3><p>{work.author || 'Auteur inconnu'}</p></div></Link>)}</div>}</section>

        <section className="discover-section"><div className="discover-heading"><div><span>🏆 TES BADGES</span><h2>Ta progression</h2></div><span>{badgeCount}/5 débloqués</span></div><div className="badge-showcase"><div className={readCount >= 1 ? 'reader-badge unlocked' : 'reader-badge'}>📖<strong>Premier chapitre</strong><small>Lire une œuvre</small></div><div className={readCount >= 5 ? 'reader-badge unlocked' : 'reader-badge'}>📚<strong>Bibliophile</strong><small>5 lectures</small></div><div className={favoriteIds.length >= 5 ? 'reader-badge unlocked' : 'reader-badge'}>❤️<strong>Collectionneur</strong><small>5 favoris</small></div><div className={favoriteIds.length >= 10 ? 'reader-badge unlocked' : 'reader-badge'}>💎<strong>Grand collectionneur</strong><small>10 favoris</small></div><div className={works.some(w => isManga(w)) ? 'reader-badge unlocked' : 'reader-badge'}>🗯️<strong>Explorateur manga</strong><small>Découvrir un manga</small></div></div></section>

        {savedBookmarks.length > 0 && <section className="discover-section"><div className="discover-heading"><div><span>🔖 MARQUE-PAGES</span><h2>À reprendre</h2></div></div><div className="discover-mini-grid">{savedBookmarks.slice(0,4).map(work => <Link key={work.id} to={`/read/${work.id}`} className="discover-mini"><img src={work.cover_url || FALLBACK_COVER} alt="" loading="lazy" /><div><span>{typeLabel(work)}</span><strong>{work.title}</strong></div></Link>)}</div></section>}

        <section className="discover-section saved-discover"><div className="discover-heading"><div><span>TA SÉLECTION</span><h2>Œuvres enregistrées</h2></div><Link to="/favoris" className="btn">Voir tout →</Link></div>{favorites.length === 0 ? <div className="empty-card"><h2>Construis ta sélection</h2><p>Ajoute ❤️ à une œuvre pour la retrouver ici.</p></div> : <div className="discover-mini-grid">{favorites.slice(0,4).map(work => <Link key={work.id} to={`/read/${work.id}`} className="discover-mini"><img src={work.cover_url || FALLBACK_COVER} alt="" loading="lazy" /><div><span>{typeLabel(work)}</span><strong>{work.title}</strong></div></Link>)}</div>}</section>

        <section className="discover-cta"><div><span>EXPLORE DAVANTAGE</span><h2>Un univers pour chaque envie.</h2></div><div className="discover-cta-actions"><Link to="/livres" className="btn primary">📚 Explorer les livres</Link><Link to="/mangas" className="btn">🗯️ Explorer les mangas</Link></div></section>
      </div>
    </main>
  )
}
