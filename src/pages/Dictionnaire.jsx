import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase.js'
import '../discover.css'
import '../dictionary.css'

const TARGET_WORDS = 10000
const FRENCH_DATA_URL = 'https://raw.githubusercontent.com/WhiteHades/wikitionary-dictionary-json/main/dist/French'
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('')

const EXTRA_ENTRIES = [
  { word: 'Nakama', type: 'Terme manga', definition: 'Mot japonais utilisé pour parler d’un compagnon, d’un allié ou d’un membre de son groupe.', example: 'Dans une histoire, les héros peuvent considérer leurs compagnons comme leurs nakama.', tags: ['Japonais', 'Manga'] },
  { word: 'Sensei', type: 'Terme manga', definition: 'Terme japonais utilisé pour s’adresser à un professeur, un enseignant ou une personne reconnue pour son expertise.', example: 'Un élève peut appeler son professeur sensei.', tags: ['Japonais', 'Manga'] },
  { word: 'Senpai', type: 'Terme manga', definition: 'Personne plus expérimentée ou arrivée avant soi dans un groupe, une école ou une activité.', example: 'Un élève plus ancien peut être appelé senpai.', tags: ['Japonais', 'Manga'] },
  { word: 'Kōhai', type: 'Terme manga', definition: 'Personne moins expérimentée ou arrivée après soi dans un groupe, une école ou une activité.', example: 'Un nouveau membre peut être considéré comme un kōhai.', tags: ['Japonais', 'Manga'] },
  { word: 'Baka', type: 'Terme manga', definition: 'Mot japonais pouvant signifier idiot ou imbécile selon le contexte.', example: 'La nuance dépend du contexte et de la relation entre les personnages.', tags: ['Japonais', 'Manga'] },
  { word: 'Yōkai', type: 'Culture manga', definition: 'Terme général désignant diverses créatures ou manifestations surnaturelles du folklore japonais.', example: 'Certains mangas mettent en scène des yōkai inspirés du folklore japonais.', tags: ['Japonais', 'Folklore'] },
  { word: 'Shōnen', type: 'Culture manga', definition: 'Catégorie éditoriale japonaise destinée principalement à un public adolescent masculin.', example: 'Le shōnen est souvent associé aux récits d’aventure et d’action.', tags: ['Manga', 'Culture'] },
  { word: 'Shōjo', type: 'Culture manga', definition: 'Catégorie éditoriale japonaise destinée principalement à un public adolescent féminin.', example: 'Les récits shōjo peuvent accorder une place importante aux relations et aux émotions.', tags: ['Manga', 'Culture'] },
  { word: 'Persévérance', type: 'Mot difficile', definition: 'Fait de continuer avec constance malgré les difficultés ou les obstacles.', example: 'Sa persévérance lui a permis de terminer son projet.', tags: ['Français', 'Vie quotidienne'] },
  { word: 'Éloquent', type: 'Mot difficile', definition: 'Qui s’exprime avec facilité, précision et force de conviction.', example: 'Son discours était clair et éloquent.', tags: ['Français'] },
  { word: 'Ambigu', type: 'Mot difficile', definition: 'Qui peut être compris de plusieurs manières et manque parfois de clarté.', example: 'Le sens de cette phrase reste ambigu.', tags: ['Français'] },
  { word: 'Intrépide', type: 'Mot difficile', definition: 'Qui ne se laisse pas arrêter par la peur du danger ou des difficultés.', example: 'Le personnage intrépide avance malgré les obstacles.', tags: ['Français'] },
]

const CATEGORIES = ['Tout', 'Français', 'Mot difficile', 'Terme manga', 'Culture manga']

function normalize(value) {
  return String(value || '').trim().toLocaleLowerCase('fr-FR').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalizeFrenchEntry(item) {
  const word = String(item?.word || item?.name || '').trim()
  const definition = String(item?.definition || item?.meaning || item?.definitions?.[0] || '').trim()
  if (!word || !definition) return null
  return { word, type: 'Français', definition, example: String(item?.example || '').trim(), tags: ['Français', item?.pos || item?.partOfSpeech || ''].filter(Boolean) }
}

async function fetchLetter(letter) {
  try {
    const response = await fetch(`${FRENCH_DATA_URL}/${letter}.json`)
    if (!response.ok) return []
    const data = await response.json()
    if (!Array.isArray(data)) return []
    return data.map(normalizeFrenchEntry).filter(Boolean)
  } catch {
    return []
  }
}

export default function Dictionnaire() {
  const [entries, setEntries] = useState(EXTRA_ENTRIES)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Tout')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadedCount, setLoadedCount] = useState(EXTRA_ENTRIES.length)
  const [sourceError, setSourceError] = useState('')

  useEffect(() => {
    let active = true

    async function loadDictionary() {
      const supabasePromise = supabase.from('dictionary_entries').select('id,word,type,definition,example,tags').order('word', { ascending: true })
      const supabaseResult = await Promise.allSettled([supabasePromise])
      let combined = [...EXTRA_ENTRIES]
      if (supabaseResult[0]?.status === 'fulfilled' && !supabaseResult[0].value.error && Array.isArray(supabaseResult[0].value.data)) {
        combined = [...supabaseResult[0].value.data, ...combined]
      }

      const seen = new Set()
      combined = combined.filter((item) => {
        const key = normalize(item.word)
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
      })

      try {
        // Chargement par petits lots pour éviter de bloquer la page.
        for (let start = 0; start < LETTERS.length && combined.length < TARGET_WORDS; start += 4) {
          if (!active) return
          const batch = await Promise.all(LETTERS.slice(start, start + 4).map(fetchLetter))
          for (const letterEntries of batch) {
            for (const item of letterEntries) {
              if (combined.length >= TARGET_WORDS) break
              const key = normalize(item.word)
              if (seen.has(key)) continue
              seen.add(key)
              combined.push({ ...item, id: `fr-${key}` })
            }
          }
          if (active) setLoadedCount(Math.min(combined.length, TARGET_WORDS))
        }

        if (active) {
          setEntries(combined.slice(0, TARGET_WORDS))
          if (combined.length < TARGET_WORDS) setSourceError(`Le corpus disponible a fourni ${combined.length.toLocaleString('fr-FR')} entrées utilisables.`)
        }
      } catch {
        if (active) {
          setEntries(combined.slice(0, TARGET_WORDS))
          setSourceError('Le corpus externe n’a pas pu être chargé. Les données déjà enregistrées restent disponibles.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDictionary()
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => {
    const q = normalize(query)
    return entries.filter((entry) => {
      const matchesCategory = category === 'Tout' || entry.type === category
      const tags = Array.isArray(entry.tags) ? entry.tags : []
      const haystack = normalize(`${entry.word} ${entry.definition} ${entry.example || ''} ${tags.join(' ')}`)
      return matchesCategory && (!q || haystack.includes(q))
    })
  }, [entries, query, category])

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
        <h1>Le mot te bloque ?<br /><span>On te l’explique.</span></h1>
        <p className="hero-lead-v2">Cherche un mot français, une expression ou un terme de manga. Les définitions sont présentées simplement pour t’aider à mieux comprendre tes lectures.</p>
        <div className="dictionary-search-wrap">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un mot, une définition ou un terme..." aria-label="Rechercher dans le dictionnaire" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Effacer la recherche">×</button>}
        </div>
        <div className="dictionary-hero-stats">
          <span><strong>{loadedCount.toLocaleString('fr-FR')}</strong> entrées chargées</span>
          <span><strong>{TARGET_WORDS.toLocaleString('fr-FR')}+</strong> objectif</span>
          <span><strong>{filtered.length.toLocaleString('fr-FR')}</strong> résultat{filtered.length > 1 ? 's' : ''}</span>
        </div>
      </section>

      <section className="dictionary-content">
        <div className="dictionary-intro">
          <div><span className="world-kicker">MIMOU DICTIONNAIRE</span><h2>Explore les mots.<br /><em>Comprends les histoires.</em></h2></div>
          <div className="dictionary-count-box"><strong>{entries.length.toLocaleString('fr-FR')}</strong><span>{entries.length >= TARGET_WORDS ? 'mots et définitions' : 'entrées actuellement disponibles'}</span></div>
        </div>

        {loading && <div className="dictionary-loading"><span className="dictionary-spinner" /> Construction du dictionnaire… {loadedCount.toLocaleString('fr-FR')} / {TARGET_WORDS.toLocaleString('fr-FR')}</div>}
        {!loading && sourceError && <div className="dictionary-source-note">ℹ️ {sourceError}</div>}

        <div className="dictionary-tabs" role="tablist" aria-label="Catégories du dictionnaire">
          {CATEGORIES.map((item) => <button key={item} type="button" className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}
        </div>

        <div className="dictionary-results-head"><span>{filtered.length.toLocaleString('fr-FR')} résultat{filtered.length > 1 ? 's' : ''}</span>{query && <button type="button" onClick={() => setQuery('')}>Effacer la recherche</button>}</div>

        <div className="dictionary-grid">
          {filtered.slice(0, 120).map((entry) => (
            <button key={entry.id || entry.word} type="button" className="dictionary-card" onClick={() => setSelected(entry)}>
              <div className="dictionary-card-top"><span>{entry.type}</span><b>↗</b></div>
              <h3>{entry.word}</h3>
              <p>{entry.definition}</p>
              <div className="dictionary-tags">{(Array.isArray(entry.tags) ? entry.tags : []).filter(Boolean).slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
            </button>
          ))}
        </div>

        {!filtered.length && <div className="dictionary-empty"><div>⌕</div><h3>Aucun mot trouvé</h3><p>Essaie une autre orthographe ou une autre catégorie.</p></div>}
        {filtered.length > 120 && <p className="dictionary-pagination-note">Affichage des 120 premiers résultats. Affine ta recherche pour trouver rapidement le bon mot.</p>}
      </section>

      <section className="dictionary-help">
        <div><span className="world-kicker">LECTURE & COMPRÉHENSION</span><h2>Un terme de manga<br /><em>te paraît bizarre ?</em></h2><p>Recherche-le dans MIMOU Dictionnaire. Tu peux aussi retourner dans la mangathèque pour continuer ta lecture.</p></div>
        <Link to="/mangas" className="btn primary">Explorer les mangas →</Link>
      </section>

      <footer className="home-footer-v2"><Link to="/" className="footer-brand-v2">MIMOU <span>BOOKISM</span></Link><span>Lire · Comprendre · Imaginer · Transmettre</span><small className="dictionary-attribution">Données lexicales françaises : Wiktionary, via le projet Wikitionary Dictionary JSON · CC BY-SA 3.0</small><Link to="/admin" className="footer-admin">Espace administration →</Link></footer>

      {selected && <div className="dictionary-modal-backdrop" role="presentation" onClick={() => setSelected(null)}>
        <section className="dictionary-modal" role="dialog" aria-modal="true" aria-labelledby="dictionary-modal-title" onClick={(event) => event.stopPropagation()}>
          <button type="button" className="dictionary-modal-close" onClick={() => setSelected(null)} aria-label="Fermer">×</button>
          <span className="world-kicker">{selected.type}</span>
          <h2 id="dictionary-modal-title">{selected.word}</h2>
          <div className="dictionary-definition"><strong>Définition</strong><p>{selected.definition}</p></div>
          {selected.example && <div className="dictionary-example"><strong>Exemple</strong><p>{selected.example}</p></div>}
          <div className="dictionary-tags">{(Array.isArray(selected.tags) ? selected.tags : []).filter(Boolean).map((tag) => <span key={tag}>{tag}</span>)}</div>
        </section>
      </div>}
    </main>
  )
}
