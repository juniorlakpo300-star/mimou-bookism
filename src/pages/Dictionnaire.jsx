import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import '../discover.css'

const ENTRIES = [
  { word: 'Persévérance', type: 'Mot difficile', definition: 'Le fait de continuer malgré les difficultés ou les obstacles.', example: 'Sa persévérance lui a permis de terminer son projet.', tags: ['Français', 'Vie quotidienne'] },
  { word: 'Éloquent', type: 'Mot difficile', definition: 'Qui s’exprime avec beaucoup de facilité et de force.', example: 'Son discours était clair et éloquent.', tags: ['Français'] },
  { word: 'Ambigu', type: 'Mot difficile', definition: 'Qui peut être compris de plusieurs façons et manque parfois de clarté.', example: 'Cette phrase est ambiguë.', tags: ['Français'] },
  { word: 'Intrépide', type: 'Mot difficile', definition: 'Qui n’a pas peur du danger ou des difficultés.', example: 'Le héros est intrépide face aux épreuves.', tags: ['Français'] },
  { word: 'Nakama', type: 'Terme manga', definition: 'Mot japonais souvent utilisé pour parler d’un compagnon, d’un allié ou d’un membre de son groupe.', example: 'Dans un manga, un héros peut appeler ses compagnons ses nakama.', tags: ['Japonais', 'Manga'] },
  { word: 'Sensei', type: 'Terme manga', definition: 'Terme japonais utilisé pour s’adresser à un professeur, un enseignant ou une personne reconnue pour son expertise.', example: 'Un élève peut appeler son professeur « sensei ».', tags: ['Japonais', 'Manga'] },
  { word: 'Senpai', type: 'Terme manga', definition: 'Personne plus expérimentée ou arrivée avant soi dans un groupe, une école ou une activité.', example: 'Un élève plus ancien peut être appelé senpai.', tags: ['Japonais', 'Manga'] },
  { word: 'Kōhai', type: 'Terme manga', definition: 'Personne moins expérimentée ou arrivée après soi dans un groupe, une école ou une activité.', example: 'Le nouveau membre peut être considéré comme un kōhai.', tags: ['Japonais', 'Manga'] },
  { word: 'Baka', type: 'Terme manga', definition: 'Insulte japonaise pouvant signifier « idiot » ou « imbécile », selon le contexte.', example: 'Le sens et la gravité dépendent de la scène et de la relation entre les personnages.', tags: ['Japonais', 'Manga'] },
  { word: 'Yōkai', type: 'Terme manga', definition: 'Créature ou esprit issu du folklore japonais. Le terme désigne une grande variété d’êtres surnaturels.', example: 'Certains mangas utilisent des yōkai comme personnages ou créatures.', tags: ['Japonais', 'Folklore'] },
  { word: 'Shōnen', type: 'Culture manga', definition: 'Catégorie éditoriale japonaise visant principalement un public adolescent masculin, souvent associée à l’aventure et à l’action.', example: 'De nombreux mangas d’aventure sont publiés dans des magazines shōnen.', tags: ['Manga', 'Culture'] },
  { word: 'Shōjo', type: 'Culture manga', definition: 'Catégorie éditoriale japonaise visant principalement un public adolescent féminin, souvent associée aux relations et aux émotions.', example: 'Les mangas shōjo peuvent mettre l’accent sur les relations entre personnages.', tags: ['Manga', 'Culture'] },
  { word: 'Maniak', type: 'Expression manga', definition: 'Terme parfois utilisé pour désigner une personne passionnée ou très spécialisée dans un sujet. Le sens exact dépend du contexte.', example: 'Dans une œuvre, un personnage peut être décrit comme un vrai maniak d’un domaine.', tags: ['Manga', 'Expression'] },
]

const CATEGORIES = ['Tout', 'Mot difficile', 'Terme manga', 'Culture manga', 'Expression manga']

export default function Dictionnaire() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Tout')
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return ENTRIES.filter((entry) => {
      const matchesCategory = category === 'Tout' || entry.type === category
      const haystack = `${entry.word} ${entry.definition} ${entry.example} ${entry.tags.join(' ')}`.toLowerCase()
      return matchesCategory && (!normalized || haystack.includes(normalized))
    })
  }, [query, category])

  return (
    <main className="landing-page home-v2 dictionary-page">
      <header className="landing-header home-header">
        <Link to="/" className="brand-v2" aria-label="MIMOU BOOKISM - Accueil">
          <span className="brand-mark" aria-hidden="true"><span className="brand-mark-page brand-mark-page-left" /><span className="brand-mark-page brand-mark-page-right" /><span className="brand-mark-dialogue">✦</span></span>
          <span className="brand-wordmark">MIMOU <b>BOOKISM</b></span>
        </Link>
        <nav className="landing-header-actions" aria-label="Navigation dictionnaire">
          <Link to="/livres" className="share-site-btn">📚 Livres</Link>
          <Link to="/mangas" className="share-site-btn">🗯️ Mangas</Link>
          <Link to="/" className="share-site-btn">🏠 Accueil</Link>
        </nav>
      </header>

      <section className="home-hero-v2 dictionary-hero">
        <div className="landing-badge hero-badge-v2">📖 MIMOU DICTIONNAIRE</div>
        <h1>Comprends chaque mot.<br /><span>Profite de chaque histoire.</span></h1>
        <p className="hero-lead-v2">Un espace simple pour expliquer les mots compliqués, les expressions et les termes que tu rencontres dans les mangas.</p>
        <div className="dictionary-search-wrap">
          <span>⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un mot, une expression ou un terme manga..." aria-label="Rechercher dans le dictionnaire" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Effacer la recherche">×</button>}
        </div>
      </section>

      <section className="dictionary-content">
        <div className="dictionary-intro">
          <div><span className="world-kicker">APPRENDRE SANS SE PERDRE</span><h2>Le mot te bloque ?<br /><em>On te l’explique simplement.</em></h2></div>
          <p>{filtered.length} entrée{filtered.length > 1 ? 's' : ''} disponible{filtered.length > 1 ? 's' : ''}</p>
        </div>

        <div className="dictionary-tabs" role="tablist" aria-label="Catégories">
          {CATEGORIES.map((item) => <button key={item} type="button" className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}
        </div>

        <div className="dictionary-grid">
          {filtered.map((entry) => (
            <button key={entry.word} type="button" className="dictionary-card" onClick={() => setSelected(entry)}>
              <div className="dictionary-card-top"><span>{entry.type}</span><b>→</b></div>
              <h3>{entry.word}</h3>
              <p>{entry.definition}</p>
              <div className="dictionary-tags">{entry.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            </button>
          ))}
        </div>

        {!filtered.length && <div className="dictionary-empty"><div>🔎</div><h3>Aucun mot trouvé</h3><p>Essaie un autre mot ou change de catégorie.</p></div>}
      </section>

      <section className="dictionary-help">
        <div><span className="world-kicker">BESOIN D’UNE EXPLICATION ?</span><h2>Tu ne comprends pas une écriture<br /><em>dans un manga ?</em></h2><p>Note le mot ou l’expression et cherche-le ici. Tu peux aussi demander de l’aide à Lia.</p></div>
        <Link to="/mangas" className="btn primary">Retourner aux mangas →</Link>
      </section>

      <footer className="home-footer-v2"><Link to="/" className="footer-brand-v2">MIMOU <span>BOOKISM</span></Link><span>Lire · Comprendre · Imaginer · Transmettre</span><Link to="/admin" className="footer-admin">Espace administration →</Link></footer>

      {selected && (
        <div className="dictionary-modal-backdrop" role="presentation" onClick={() => setSelected(null)}>
          <section className="dictionary-modal" role="dialog" aria-modal="true" aria-labelledby="dictionary-modal-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="dictionary-modal-close" onClick={() => setSelected(null)} aria-label="Fermer">×</button>
            <span className="world-kicker">{selected.type}</span>
            <h2 id="dictionary-modal-title">{selected.word}</h2>
            <div className="dictionary-definition"><strong>Définition simple</strong><p>{selected.definition}</p></div>
            <div className="dictionary-example"><strong>Exemple</strong><p>{selected.example}</p></div>
            <div className="dictionary-tags">{selected.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          </section>
        </div>
      )}
    </main>
  )
}
