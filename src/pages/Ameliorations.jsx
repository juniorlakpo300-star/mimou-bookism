import { Link } from 'react-router-dom'

const updates = [
  ['01','🔥','Tendances','Classement des œuvres les plus populaires.'],
  ['02','👁️','Compteur de lectures','Suivi du nombre de lectures de chaque œuvre.'],
  ['03','⭐','Notes','Évaluer les livres et mangas avec des étoiles.'],
  ['04','🔎','Recherche avancée','Recherche par titre, auteur, genre et type.'],
  ['05','🏷️','Badges','NOUVEAU, TENDANCE, GRATUIT et MANGA pour mieux repérer les œuvres.'],
  ['06','🔖','Marque-pages','Retrouver facilement les œuvres à reprendre.'],
  ['07','📖','Progression','Garder une trace de la progression de lecture.'],
  ['08','🌙','Mode lecture','Une interface plus confortable pour lire.'],
  ['09','🔔','Notifications','Être informé des nouvelles publications.'],
  ['10','🏆','Récompenses','Débloquer des badges en explorant la bibliothèque.'],
  ['11','🤖','Lia améliorée','Accès rapide aux recherches, recommandations et aide.'],
  ['12','📱','Mobile','Interface pensée pour téléphone, tablette et ordinateur.'],
  ['13','🎨','Univers visuels','Ambiance livres et mangas adaptée à chaque section.'],
  ['14','❤️','Ma bibliothèque','Favoris regroupés dans un espace personnel local.'],
  ['15','🆕','Nouveautés','Les dernières œuvres publiées mises en avant.'],
  ['16','✍️','Espace auteur','Parcours plus clair pour proposer une œuvre.'],
  ['17','💬','Commentaires','Pseudo public pour discuter autour des œuvres.'],
  ['18','↗️','Partage','Partager facilement MIMOU BOOKISM ou une œuvre.'],
  ['19','🛡️','Administration','Espace admin séparé pour publier et gérer les contenus.'],
]

export default function Ameliorations() {
  return (
    <main className="page updates-page">
      <div className="container">
        <header className="header">
          <Link to="/" className="brand">MIMOU <span>BOOKISM</span></Link>
          <nav className="nav">
            <Link to="/decouvrir" className="btn">🔥 Découvrir</Link>
            <Link to="/livres" className="btn">📚 Livres</Link>
            <Link to="/mangas" className="btn">🗯️ Mangas</Link>
            <Link to="/admin" className="btn">⚙ Admin</Link>
          </nav>
        </header>

        <section className="updates-hero">
          <span className="eyebrow">MIMOU BOOKISM · ÉVOLUTION</span>
          <h1>19 améliorations pour une expérience plus forte.</h1>
          <p>Une feuille de route claire pour rendre la plateforme plus belle, plus pratique et plus vivante, sans toucher au fonctionnement des PDF.</p>
        </section>

        <section className="updates-grid">
          {updates.map(([number, icon, title, text]) => (
            <article className="update-card" key={number}>
              <div className="update-top"><span>{number}</span><b>{icon}</b></div>
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          ))}
        </section>

        <section className="updates-bottom">
          <div><span className="eyebrow">PROCHAINE ÉTAPE</span><h2>Construire ces améliorations sans casser ce qui fonctionne.</h2><p>Les fonctions sensibles comme l'upload et la lecture PDF doivent rester intactes pendant les prochaines évolutions.</p></div>
          <Link to="/decouvrir" className="btn primary">Retour à Découvrir →</Link>
        </section>
      </div>
    </main>
  )
}
