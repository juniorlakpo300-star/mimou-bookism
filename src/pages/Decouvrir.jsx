import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase.js'

const FAVORITES_KEY = 'mimou_bookism_favorites'
const LAST_READ_KEY = 'mimou_bookism_last_read'
const HISTORY_KEY = 'mimou_bookism_reading_history'
const BOOKMARKS_KEY = 'mimou_bookism_bookmarks'
const PROGRESS_KEY = 'mimou_bookism_reading_progress'
const VISIT_KEY = 'mimou_bookism_last_visit'
const REWARDS_KEY = 'mimou_bookism_rewards'
const FALLBACK_COVER = 'https://placehold.co/400x560/0f172a/94a3b8?text=MIMOU+BOOKISM'

function readIds(key) { try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] } }
function readObject(key) { try { return JSON.parse(localStorage.getItem(key) || '{}') } catch { return {} } }
function readHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] } }

export default function Decouvrir() {
  const [works, setWorks] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRead, setLastRead] = useState(null)
  const [history, setHistory] = useState(readHistory)
  const [newSinceVisit, setNewSinceVisit] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notificationsRead, setNotificationsRead] = useState(false)
  const [rewards, setRewards] = useState(() => readObject(REWARDS_KEY))
  const favoriteIds = readIds(FAVORITES_KEY)
  const bookmarks = readObject(BOOKMARKS_KEY)

  useEffect(() => {
    const saved = localStorage.getItem(LAST_READ_KEY)
    if (saved) try { setLastRead(JSON.parse(saved)) } catch {}
    setHistory(readHistory())
    const previousVisit = Number(localStorage.getItem(VISIT_KEY) || 0)
    async function load() {
      const { data, error } = await supabase.from('books').select('id,title,author,category,description,cover_url,created_at,views_count,is_free').order('created_at', { ascending: false })
      if (!error) {
        const list = data || []
        setWorks(list)
        setNewSinceVisit(previousVisit ? list.filter(w => new Date(w.created_at).getTime() > previousVisit).length : 0)
      }
      localStorage.setItem(VISIT_KEY, String(Date.now()))
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    const next = { ...rewards, favoriteCount: favoriteIds.length, lastSeenAt: Date.now() }
    if (lastRead?.id) next.lastReadId = lastRead.id
    if (JSON.stringify(next) !== JSON.stringify(rewards)) {
      setRewards(next)
      localStorage.setItem(REWARDS_KEY, JSON.stringify(next))
    }
  }, [favoriteIds.length, lastRead?.id])

  const newest = works.slice(0, 6)
  const trends = useMemo(() => [...works].sort((a,b) => Number(b.views_count || 0) - Number(a.views_count || 0)).slice(0, 5), [works])
  const favorites = useMemo(() => favoriteIds.map(id => works.find(work => work.id === id)).filter(Boolean), [works, favoriteIds])
  const savedBookmarks = useMemo(() => Object.values(bookmarks).map(item => works.find(work => work.id === item.id) || item).filter(Boolean), [works, bookmarks])
  const historyWorks = useMemo(() => history.map(item => works.find(work => work.id === item.id) || item).filter(Boolean).slice(0, 12), [works, history])
  const notificationItems = useMemo(() => {
    const previousVisit = Number(localStorage.getItem(VISIT_KEY) || 0)
    return previousVisit ? works.filter(work => new Date(work.created_at).getTime() > previousVisit).slice(0, 5) : []
  }, [works, newSinceVisit])
  const readCount = Number(localStorage.getItem('mimou_bookism_read_count') || 0)
  const progressMap = readObject(PROGRESS_KEY)
  const completedCount = Object.values(progressMap).filter(value => Number(value) >= 100).length
  const mangaDiscovered = works.some(w => String(w.category || '').toLowerCase().startsWith('manga •'))
  const badges = [
    { id: 'first-read', icon: '📖', title: 'Premier chapitre', text: 'Lire une œuvre', unlocked: readCount >= 1 },
    { id: 'bibliophile', icon: '📚', title: 'Bibliophile', text: '5 lectures', unlocked: readCount >= 5 },
    { id: 'collector', icon: '❤️', title: 'Collectionneur', text: '5 favoris', unlocked: favoriteIds.length >= 5 },
    { id: 'grand-collector', icon: '💎', title: 'Grand collectionneur', text: '10 favoris', unlocked: favoriteIds.length >= 10 },
    { id: 'manga-explorer', icon: '🗯️', title: 'Explorateur manga', text: 'Découvrir un manga', unlocked: mangaDiscovered },
    { id: 'finisher', icon: '🏁', title: 'Finisher', text: 'Terminer une lecture', unlocked: completedCount >= 1 },
    { id: 'marathon', icon: '🔥', title: 'Marathon', text: '10 lectures', unlocked: readCount >= 10 },
    { id: 'bookmark-master', icon: '🔖', title: 'Mémoire d’or', text: '3 marque-pages', unlocked: savedBookmarks.length >= 3 },
  ]
  const unlockedBadges = badges.filter(badge => badge.unlocked).length
  const points = readCount * 10 + favoriteIds.length * 5 + savedBookmarks.length * 3 + completedCount * 25
  const level = Math.max(1, Math.floor(points / 100) + 1)
  const levelProgress = points % 100
  const progress = Number(progressMap[lastRead?.id] || lastRead?.progress || 0)
  const isManga = work => String(work?.category || '').toLowerCase().startsWith('manga •')
  const typeLabel = work => isManga(work) ? '🗯️ MANGA' : '📚 LIVRE'

  function markNotificationsRead() {
    setNotificationsRead(true)
    setNewSinceVisit(0)
    localStorage.setItem(VISIT_KEY, String(Date.now()))
  }

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
          <button type="button" className={`notification-button ${newSinceVisit > 0 && !notificationsRead ? 'has-new' : ''}`} onClick={() => setShowNotifications(v => !v)}>🔔 Notifications {newSinceVisit > 0 && !notificationsRead && <b>{newSinceVisit}</b>}</button>
          {showNotifications && <div className="notification-popover"><div className="notification-popover-head"><strong>Depuis ta dernière visite</strong><button type="button" className="notification-read-btn" onClick={markNotificationsRead}>Tout marquer comme lu</button></div>{notificationItems.length ? notificationItems.map(work => <Link key={work.id} to={`/read/${work.id}`} className="notification-item"><span>🆕</span><div><strong>{work.title || 'Nouvelle œuvre'}</strong><small>{isManga(work) ? 'Nouveau manga' : 'Nouveau livre'} · {work.author || 'Auteur inconnu'}</small></div></Link>) : <p>{newSinceVisit ? 'De nouvelles publications sont disponibles.' : 'Tu es à jour. Rien de nouveau pour le moment.'}</p>}</div>}
        </section>

        {lastRead && works.some(work => work.id === lastRead.id) && <section className="continue-card"><div className="continue-cover"><img src={lastRead.cover_url || FALLBACK_COVER} alt="" loading="lazy" /></div><div><span className="section-kicker">REPRENDRE MA LECTURE</span><h2>{lastRead.title}</h2><p>Continue ton aventure là où tu t'es arrêté.</p><div className="continue-progress"><div className="continue-progress-heading"><span>Progression</span><strong>{progress}%</strong></div><div className="continue-progress-track" aria-hidden="true"><div className="continue-progress-fill" style={{ width: `${progress}%` }} /></div></div><Link to={`/read/${lastRead.id}`} className="btn primary">📖 Continuer</Link></div></section>}

        <section className="reward-panel"><div className="reward-main"><span className="section-kicker">🏆 TON PROFIL LECTEUR</span><h2>Niveau {level}</h2><p>{points} points · encore {100 - levelProgress} points pour le prochain niveau</p><div className="reward-progress"><div className="reward-progress-fill" style={{ width: `${levelProgress}%` }} /></div></div><div className="reward-stats"><div><strong>{unlockedBadges}</strong><span>Badges</span></div><div><strong>{readCount}</strong><span>Lectures</span></div><div><strong>{completedCount}</strong><span>Terminées</span></div></div></section>

        <section className="discover-section"><div className="discover-heading"><div><span>🔥 TENDANCES</span><h2>Les œuvres les plus lues</h2></div><span>Top {trends.length}</span></div>{trends.length ? <div className="discover-grid">{trends.map((work,index) => <Link key={work.id} to={`/read/${work.id}`} className="discover-card"><div className="discover-cover"><img src={work.cover_url || FALLBACK_COVER} alt="" loading="lazy" onError={e => { e.currentTarget.src = FALLBACK_COVER }} /><span>#{index + 1} · {typeLabel(work)}</span></div><div className="discover-info"><h3>{work.title || 'Sans titre'}</h3><p>{work.author || 'Auteur inconnu'} · 👁️ {Number(work.views_count || 0)} lecture(s)</p></div></Link>)}</div> : <div className="empty-card"><p>Les tendances apparaîtront après les premières lectures.</p></div>}</section>

        <section className="discover-section"><div className="discover-heading"><div><span>✨ NOUVEAUTÉS</span><h2>Les dernières publications</h2></div><span>{newest.length} œuvres</span></div>{newest.length === 0 ? <div className="empty-card"><h2>Pas encore de publication</h2></div> : <div className="discover-grid">{newest.map(work => <Link key={work.id} to={`/read/${work.id}`} className="discover-card"><div className="discover-cover"><img src={work.cover_url || FALLBACK_COVER} alt={`Couverture de ${work.title || 'œuvre'}`} loading="lazy" onError={e => { e.currentTarget.src = FALLBACK_COVER }} /><span>{typeLabel(work)}</span></div><div className="discover-info"><h3>{work.title || 'Sans titre'}</h3><p>{work.author || 'Auteur inconnu'}</p></div></Link>)}</div>}</section>

        <section className="discover-section"><div className="discover-heading"><div><span>🕘 HISTORIQUE RÉCENT</span><h2>Tes lectures récentes</h2></div><span>{historyWorks.length} / 12</span></div>{historyWorks.length ? <div className="discover-history-grid">{historyWorks.map(work => { const item = history.find(entry => entry.id === work.id) || work; const itemProgress = Number(progressMap[work.id] ?? item.progress ?? 0); return <Link key={work.id} to={`/read/${work.id}`} className="history-discover-card"><img src={work.cover_url || FALLBACK_COVER} alt="" loading="lazy" /><div><span className="section-kicker">{itemProgress >= 100 ? 'LECTURE TERMINÉE' : 'EN COURS'}</span><h3>{work.title || 'Sans titre'}</h3><p>{work.author || 'Auteur inconnu'} · <strong>{itemProgress}%</strong></p><div className="continue-progress-track" aria-hidden="true"><div className="continue-progress-fill" style={{ width: `${itemProgress}%` }} /></div><span className="btn primary">{itemProgress >= 100 ? '📖 Relire' : '▶️ Reprendre'}</span></div></Link> })}</div> : <div className="empty-card"><h2>Aucune lecture récente</h2><p>Ouvre une œuvre pour commencer ton historique.</p><div><Link to="/livres" className="btn primary">📚 Choisir un livre</Link> <Link to="/mangas" className="btn">🗯️ Choisir un manga</Link></div></div>}</section>

        <section className="discover-section"><div className="discover-heading"><div><span>🏆 TES BADGES</span><h2>Ta collection de récompenses</h2></div><span>{unlockedBadges}/{badges.length} débloqués</span></div><div className="badge-showcase">{badges.map(badge => <div key={badge.id} className={`reader-badge ${badge.unlocked ? 'unlocked' : ''}`}><span className="badge-icon">{badge.icon}</span><strong>{badge.title}</strong><small>{badge.unlocked ? '✓ Débloqué' : badge.text}</small></div>)}</div></section>

        {savedBookmarks.length > 0 && <section className="discover-section"><div className="discover-heading"><div><span>🔖 MARQUE-PAGES</span><h2>À reprendre</h2></div></div><div className="discover-mini-grid">{savedBookmarks.slice(0,4).map(work => <Link key={work.id} to={`/read/${work.id}`} className="discover-mini"><img src={work.cover_url || FALLBACK_COVER} alt="" loading="lazy" /><div><span>{typeLabel(work)}</span><strong>{work.title}</strong></div></Link>)}</div></section>}

        <section className="discover-section saved-discover"><div className="discover-heading"><div><span>TA SÉLECTION</span><h2>Œuvres enregistrées</h2></div><Link to="/favoris" className="btn">Voir tout →</Link></div>{favorites.length === 0 ? <div className="empty-card"><h2>Construis ta sélection</h2><p>Ajoute ❤️ à une œuvre pour la retrouver ici.</p></div> : <div className="discover-mini-grid">{favorites.slice(0,4).map(work => <Link key={work.id} to={`/read/${work.id}`} className="discover-mini"><img src={work.cover_url || FALLBACK_COVER} alt="" loading="lazy" /><div><span>{typeLabel(work)}</span><strong>{work.title}</strong></div></Link>)}</div>}</section>

        <section className="discover-cta"><div><span>EXPLORE DAVANTAGE</span><h2>Un univers pour chaque envie.</h2></div><div className="discover-cta-actions"><Link to="/livres" className="btn primary">📚 Explorer les livres</Link><Link to="/mangas" className="btn">🗯️ Explorer les mangas</Link></div></section>
      </div>
    </main>
  )
}
