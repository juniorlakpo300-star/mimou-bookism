import '../landing.css'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'

export default function Home() {
  const { user } = useAuth()

  return (
    <main className="landing-page">
      <header className="landing-header">
        <Link to="/" className="landing-brand">MIMOU <span>BOOKISM</span></Link>
        <Link to="/admin" className="btn admin-btn">🛠️ Admin</Link>
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
        <Link to={user ? '/catalogue?access=premium' : '/inscription'} className="access-card premium-card">
          <div className="access-icon">👑</div>
          <div><span className="access-label">ACCÈS MEMBRE</span><h2>Premium</h2><p>{user ? 'Accédez à votre espace Premium.' : 'Créez un compte pour accéder à Premium.'}</p></div>
          <strong>→</strong>
        </Link>
      </section>
      {!user && <p className="landing-login">Déjà membre ? <Link to="/connexion">Se connecter</Link></p>}
    </main>
  )
}
