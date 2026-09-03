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
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(PUBLIC_SITE_URL)
        alert('Lien du site copié !')
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(PUBLIC_SITE_URL)
          alert('Lien du site copié !')
        } catch {
          // Rien à faire si le navigateur bloque le presse-papiers.
        }
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
        <div className="landing-badge">📚 BIBLIOTHÈQUE NUMÉRIQUE</div>
        <h1>Bienvenue sur<br /><span>MIMOU BOOKISM</span></h1>
        <p>Découvrez, lisez et partagez des livres dans un espace pensé pour les passionnés de lecture.</p>
        <Link to="/choix" className="landing-enter">Entrer dans MIMOU BOOKISM <span>→</span></Link>
      </section>

      <section className="landing-options">
        <Link to="/catalogue?access=free" className="access-card free-card">
          <div className="access-icon">📖</div>
          <div><span className="access-label">ACCÈS LIBRE</span><h2>Livres gratuits</h2><p>Lisez les livres gratuits sans créer de compte.</p></div>
          <strong>→</strong>
        </Link>
        <Link to="/catalogue?access=premium" className="access-card premium-card">
          <div className="access-icon">👑</div>
          <div><span className="access-label">PREMIUM</span><h2>Livres Premium</h2><p>Découvrez l'espace Premium de MIMOU BOOKISM.</p></div>
          <strong>→</strong>
        </Link>
      </section>
    </main>
  )
}
