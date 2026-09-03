import '../landing.css'
import { Link } from 'react-router-dom'

export default function Choix() {
  return (
    <main className="landing-page choice-page">
      <header className="landing-header">
        <Link to="/" className="landing-brand">MIMOU <span>BOOKISM</span></Link>
        <Link to="/admin" className="btn admin-btn">🛠️ Admin</Link>
      </header>

      <section className="choice-hero">
        <div className="landing-badge">CHOISISSEZ VOTRE ACCÈS</div>
        <h1>Comment voulez-vous<br /><span>lire aujourd'hui ?</span></h1>
        <p>Les livres gratuits sont accessibles à tous. L’administration est réservée au compte administrateur.</p>
      </section>

      <section className="landing-options">
        <Link to="/catalogue?access=free" className="access-card free-card">
          <div className="access-icon">📖</div>
          <div><span className="access-label">SANS COMPTE</span><h2>Livres gratuits</h2><p>Accédez directement aux livres gratuits, sans inscription ni connexion.</p></div>
          <strong>→</strong>
        </Link>
        <Link to="/catalogue?access=premium" className="access-card premium-card">
          <div className="access-icon">👑</div>
          <div><span className="access-label">PREMIUM</span><h2>Livres Premium</h2><p>Découvrez les contenus Premium disponibles sur MIMOU BOOKISM.</p></div>
          <strong>→</strong>
        </Link>
      </section>
    </main>
  )
}
