import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase.js'

const FAVORITES_KEY = 'mimou_bookism_favorites'
const LAST_READ_KEY = 'mimou_bookism_last_read'
const FALLBACK_COVER = 'https://placehold.co/400x560/0f172a/94a3b8?text=MIMOU+BOOKISM'

function readIds(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}

export default function Decouvrir() {
  const [works, setWorks] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRead, setLastRead] = useState(null)
  const favoriteIds = readIds(FAVORITES_KEY)

  useEffect(() => {
    const saved = localStorage.getItem(LAST_READ_KEY)
    if (saved) {
      try { setLastRead(JSON.parse(saved)) } catch {}
    }

    async function load() {
      const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false })
      setWorks(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const newest = works.slice(0, 6)
  const favorites = useMemo(() => favoriteIds.map(id => works.find(work => work.id === id)).filter(Boolean), [works, favoriteIds])

  const isManga = work => String(work?.category || '').toLowerCase().startsWith('manga •')
  const typeLabel = work => isManga(work) ? '🗯️ MANGA' : '📚 LIVRE'

  if (loading) return <div className="state">Préparation de la découverte...</div>

  return (
    <main className="page discover-page">
      <div className="container">
        <header className="header">
          <Link to="/" className="brand">MIMOU <span>BOOKISM</span></Link>
          <nav className="nav">
            <Link to="/livres" className="btn">📚 Livres</Link>
            <Link to="/mangas" className="btn">🗯️ Mangas</Link>
            <Link to="/decouvrir" className="btn active">🔥 Découvrir</Link>
            <Link to="/favoris" className="btn">❤️ Ma bibliothèque</Link>
          </nav>
        </header>

        <section className="discover-hero">
          <div>
            <p className="eyebrow">MIMOU BOOKISM · DISCOVERY</p>
            <h1>Trouve ta prochaine histoire.</h1>
            <p>Les nouveautés, ta reprise de lecture et les œuvres que tu as sauvegardées réunis au même endroit.</p>
          </div>
          <div className="discover-orbit">✦</div>
        </section>

        {lastRead && works.some(work => work.id === lastRead.id) && (
          <section className="continue-card">
            <div className="continue-cover"><img src={lastRead.cover_url || FALLBACK_COVER} alt="" /></div>
            <div>
              <span className="section-kicker">REPRENDRE MA LECTURE</span>
              <h2>{lastRead.title}</h2>
              <p>Tu avais commencé cette œuvre. Continue là où tu t'es arrêté.</p>
              <Link to={`/read/${lastRead.id}`} className="btn primary">📖 Continuer</Link>
            </div>
          </section>
        )}

        <section className="discover-section">
          <div className="discover-heading"><div><span>NOUVEAUTÉS</span><h2>Les dernières publications</h2></div><span>{newest.length} œuvres</span></div>
          {newest.length === 0 ? <div className="empty-card"><h2>Pas encore de publication</h2><p>Les nouvelles œuvres apparaîtront ici.</p></div> : (
            <div className="discover-grid">
              {newest.map(work => (
                <Link key={work.id} to={`/read/${work.id}`} className="discover-card">
                  <div className="discover-cover"><img src={work.cover_url || FALLBACK_COVER} alt={`Couverture de ${work.title || 'œuvre'}`} onError={e => { e.currentTarget.src = FALLBACK_COVER }} /><span>{typeLabel(work)}</span></div>
                  <div className="discover-info"><h3>{work.title || 'Sans titre'}</h3><p>{work.author || (isManga(work) ? 'Mangaka inconnu' : 'Auteur inconnu')}</p></div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="discover-section saved-discover">
          <div className="discover-heading"><div><span>TA SÉLECTION</span><h2>Œuvres enregistrées</h2></div><Link to="/favoris" className="btn">Voir tout →</Link></div>
          {favorites.length === 0 ? <div className="empty-card"><h2>Construis ta sélection</h2><p>Ajoute ❤️ à une œuvre pour la retrouver ici.</p></div> : (
            <div className="discover-mini-grid">
              {favorites.slice(0, 4).map(work => <Link key={work.id} to={`/read/${work.id}`} className="discover-mini"><img src={work.cover_url || FALLBACK_COVER} alt="" onError={e => { e.currentTarget.src = FALLBACK_COVER }} /><div><span>{typeLabel(work)}</span><strong>{work.title}</strong></div></Link>)}
            </div>
          )}
        </section>

        <section className="discover-cta">
          <div><span>EXPLORE DAVANTAGE</span><h2>Un univers pour chaque envie.</h2></div>
          <div className="discover-cta-actions"><Link to="/livres" className="btn primary">📚 Explorer les livres</Link><Link to="/mangas" className="btn">🗯️ Explorer les mangas</Link></div>
        </section>
      </div>
    </main>
  )
}
