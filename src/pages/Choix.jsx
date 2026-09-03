import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'

export default function Choix() {
  const { user } = useAuth()

  return (
    <main className="landing-page choice-page">
      <header className="landing-header">
        <Link to="/" className="landing-brand">MIMOU <span>BOOKISM</span></Link>
        <Link to="/admin" className="btn admin-btn">🛠️ Admin</Link>
      </header>

      <section className="choice-hero">
        <div className="landing-badge">CHOISISSEZ VOTRE ACCÈS</div>
        <h1>Comment voulez-vous<br /><span>lire aujourd'hui ?</span></h1>
        <p>Les livres gratuits restent accessibles à tous. Premium est réservé aux membres.</p>
      </section>

      <section className="landing-options">
        <Link to="/catalogue?access=free" className="access-card free-card">
          <div className="access-icon">📖</div>
          <div><span className="access-label">SANS COMPTE</span><h2>Livres gratuits</h2><p>Accédez directement aux livres gratuits, sans inscription.</p></div>
          <strong>→</strong>
        </Link>
        <Link to={user ? '/catalogue?access=premium' : '/inscription'} className="access-card premium-card">
          <div className="access-icon">👑</div>
          <div><span className="access-label">COMPTE REQUIS</span><h2>Premium</h2><p>{user ? 'Votre compte est connecté. Entrez dans Premium.' : 'Créez gratuitement votre compte pour continuer.'}</p></div>
          <strong>→</strong>
        </Link>
      </section>

      {!user && <p className="landing-login">Déjà un compte ? <Link to="/connexion">Se connecter</Link></p>}
    </main>
  )
}
