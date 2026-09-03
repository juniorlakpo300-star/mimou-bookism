import '../landing.css'
import { Link } from 'react-router-dom'

const PUBLIC_SITE_URL = 'https://mimou-bookism-hz66pjgau-mimou.vercel.app/'

export default function Home() {
  const shareSite = async () => {
    const shareData = {
      title: 'MIMOU BOOKISM',
      text: 'Découvre MIMOU BOOKISM, ta bibliothèque numérique.',
      url: PUBLIC_SITE_URL,
    }

    try {
      if (navigator.share) await navigator.share(shareData)
      else {
        await navigator.clipboard.writeText(PUBLIC_SITE_URL)
        alert('Lien du site copié !')
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(PUBLIC_SITE_URL)
          alert('Lien du site copié !')
        } catch {}
      }
    }
  }

  return (
    <main className="landing-page">
      <header className="landing-header">
        <Link to="/" className="landing-brand">MIMOU <span>BOOKISM</span></Link>
        <div className="landing-header-actions">
          <button type="button" className="share-site-btn" onClick={shareSite}>🔗 Partager le site</button>
          <Link to="/admin" className="btn admin-btn">🛠️ Admin</Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-badge">📚 MIMOU BOOKISM</div>
        <h1>Bienvenue sur<br /><span>TON ESPACE DE LECTURE</span></h1>
        <p>Découvre une bibliothèque de livres et une mangathèque réunies dans MIMOU BOOKISM.</p>
      </section>

      <section className="landing-options">
        <Link to="/livres" className="access-card free-card">
          <div className="access-icon">📚</div>
          <div><span className="access-label">BIBLIOTHÈQUE</span><h2>Livres</h2><p>Romans, contes, poésie, essais et autres œuvres littéraires.</p></div>
          <strong>→</strong>
        </Link>

        <Link to="/mangas" className="access-card premium-card">
          <div className="access-icon">🗯️</div>
          <div><span className="access-label">MANGATHÈQUE</span><h2>Mangas</h2><p>Retrouve les mangas, leurs tomes et leurs chapitres dans un espace dédié.</p></div>
          <strong>→</strong>
        </Link>
      </section>

      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 60px', textAlign: 'center' }}>
        <Link to="/choix" className="landing-enter">Entrer dans MIMOU BOOKISM <span>→</span></Link>
      </section>
    </main>
  )
}
