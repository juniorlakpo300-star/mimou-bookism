import '../landing.css'
import { Link } from 'react-router-dom'

const WHATSAPP_URL = 'https://wa.me/2250566111378?text=Bonjour%20MIMOU%20BOOKISM%2C%20je%20souhaite%20publier%20mon%20livre%20ou%20mon%20manga%20sur%20le%20site.'

export default function Home() {
  const shareSite = async () => {
    const publicSiteUrl = `${window.location.origin}/`
    const shareData = { title: 'MIMOU BOOKISM', text: 'Découvre MIMOU BOOKISM, ta bibliothèque numérique.', url: publicSiteUrl }
    try {
      if (navigator.share) await navigator.share(shareData)
      else {
        await navigator.clipboard.writeText(publicSiteUrl)
        alert('Lien du site copié !')
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(publicSiteUrl)
          alert('Lien du site copié !')
        } catch {}
      }
    }
  }

  return (
    <main className="landing-page home-v2">
      <header className="landing-header home-header">
        <Link to="/" className="brand-v2" aria-label="MIMOU BOOKISM - Accueil">
          <span className="brand-mark" aria-hidden="true"><span className="brand-mark-page brand-mark-page-left" /><span className="brand-mark-page brand-mark-page-right" /><span className="brand-mark-dialogue">✦</span></span>
          <span className="brand-wordmark">MIMOU <b>BOOKISM</b></span>
        </Link>
        <div className="landing-header-actions">
          <Link to="/dictionnaire" className="share-site-btn home-discover-link">📖 Dictionnaire</Link>
          <Link to="/decouvrir" className="share-site-btn home-discover-link">🔥 Découvrir</Link>
          <button type="button" className="share-site-btn" onClick={shareSite}>↗ Partager</button>
          <Link to="/admin" className="btn admin-btn">⚙ Admin</Link>
        </div>
      </header>

      <section className="home-hero-v2">
        <div className="hero-orbit hero-orbit-one" /><div className="hero-orbit hero-orbit-two" />
        <div className="landing-badge hero-badge-v2">UNE SEULE IDENTITÉ · DEUX UNIVERS · MILLE HISTOIRES</div>
        <h1>Les histoires<br /><span>prennent vie ici.</span></h1>
        <p className="hero-lead-v2">Bienvenue sur <strong>MIMOU BOOKISM</strong>, un espace où les mots des livres rencontrent l'énergie des mangas.</p>
        <div className="hero-quote-card"><span className="quote-label">PENSER · LIRE · TRANSMETTRE</span><p>« Un peuple sans connaissance de son histoire est comme un arbre sans racines. »</p><small>— Marcus Garvey</small></div>
      </section>

      <section className="worlds-section">
        <div className="section-heading-v2"><span>CHOISIS TON UNIVERS</span><h2>Deux mondes.<br /><em>Une même passion.</em></h2></div>
        <div className="worlds-grid-v2">
          <Link to="/livres" className="world-card-v2 books-world"><div className="world-number">01</div><div className="world-symbol books-symbol"><span /><span /><i>✦</i></div><div className="world-content-v2"><span className="world-kicker">BIBLIOTHÈQUE</span><h3>Livres</h3><p>Romans, contes, poésie, essais et voix littéraires à découvrir.</p></div><div className="world-arrow">→</div></Link>
          <Link to="/mangas" className="world-card-v2 manga-world"><div className="world-number">02</div><div className="world-symbol manga-symbol"><span>漫</span><span>画</span><i>⚡</i></div><div className="world-content-v2"><span className="world-kicker">MANGATHÈQUE</span><h3>Mangas</h3><p>Des aventures, des personnages et des univers graphiques à parcourir.</p></div><div className="world-arrow">→</div></Link>
        </div>
      </section>

      <section className="home-discover-banner">
        <div><span>🔥 NOUVEL ESPACE</span><h2>Découvre les nouveautés<br /><em>et reprends ta lecture.</em></h2><p>Un espace central pour retrouver les dernières publications et tes œuvres sauvegardées.</p></div>
        <Link to="/decouvrir" className="btn primary">Explorer MIMOU BOOKISM →</Link>
      </section>

      <section className="quotes-v2">
        <div className="quote-panel quote-naruto"><span className="quote-tag">MANGA · NARUTO</span><p>« Je ne reviendrai jamais sur ma parole. »</p><small>— Naruto Uzumaki</small></div>
        <div className="quote-panel quote-eren"><span className="quote-tag">MANGA · EREN</span><p>« Je continuerai d'avancer. »</p><small>— Eren Yeager</small></div>
      </section>

      <section className="author-v2"><div className="author-line" /><div><span>VOIX AFRICAINE</span><blockquote>« En Afrique, un vieillard qui meurt est une bibliothèque qui brûle. »</blockquote><p>— Amadou Hampâté Bâ</p></div><div className="author-line" /></section>

      <section className="publish-v2"><div><span className="world-kicker">TU AS UNE HISTOIRE À PARTAGER ?</span><h2>Fais-la entrer dans<br /><em>MIMOU BOOKISM.</em></h2><p>Tu veux proposer ton livre ou ton manga ? Contacte-nous directement.</p></div><a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="whatsapp-v2"><span>◉</span> Nous contacter sur WhatsApp <b>→</b></a></section>

      <footer className="home-footer-v2"><Link to="/" className="footer-brand-v2">MIMOU <span>BOOKISM</span></Link><span>Lire · Imaginer · Créer · Transmettre</span><Link to="/admin" className="footer-admin">Espace administration →</Link></footer>
    </main>
  )
}