import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { useAuth } from '../AuthContext.jsx'
import '../index.css'

const ADMIN_EMAIL = 'juniorlakpo300@gmail.com'
const EMPTY = { word: '', type: 'Mot difficile', definition: '', example: '', tags: '' }

export default function AdminDictionnaire() {
  const { user, loading: authLoading } = useAuth()
  const [entries, setEntries] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()

  async function loadEntries() {
    setLoading(true)
    setError('')
    const { data, error: loadError } = await supabase.from('dictionary_entries').select('*').order('created_at', { ascending: false })
    if (loadError) setError(`Impossible de charger le dictionnaire : ${loadError.message}`)
    else setEntries(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (!authLoading && isAdmin) loadEntries()
  }, [authLoading, isAdmin])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries.filter(item => !q || `${item.word} ${item.definition} ${item.type}`.toLowerCase().includes(q))
  }, [entries, search])

  function updateField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function startEdit(entry) {
    setEditing(entry.id)
    setForm({ word: entry.word || '', type: entry.type || 'Mot difficile', definition: entry.definition || '', example: entry.example || '', tags: Array.isArray(entry.tags) ? entry.tags.join(', ') : '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditing(null)
    setForm(EMPTY)
  }

  async function saveEntry(event) {
    event.preventDefault()
    if (!isAdmin) return
    const word = form.word.trim()
    const definition = form.definition.trim()
    if (!word || !definition) {
      setError('Le mot et sa définition sont obligatoires.')
      return
    }
    setSaving(true)
    setError('')
    const payload = {
      word,
      type: form.type,
      definition,
      example: form.example.trim(),
      tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      updated_at: new Date().toISOString(),
    }
    const result = editing
      ? await supabase.from('dictionary_entries').update(payload).eq('id', editing).select().single()
      : await supabase.from('dictionary_entries').insert(payload).select().single()
    setSaving(false)
    if (result.error) {
      setError(`Enregistrement impossible : ${result.error.message}`)
      return
    }
    if (editing) setEntries(prev => prev.map(item => item.id === editing ? result.data : item))
    else setEntries(prev => [result.data, ...prev])
    resetForm()
  }

  async function deleteEntry(entry) {
    if (!window.confirm(`Supprimer « ${entry.word} » du dictionnaire ?`)) return
    const { error: deleteError } = await supabase.from('dictionary_entries').delete().eq('id', entry.id)
    if (deleteError) setError(`Suppression impossible : ${deleteError.message}`)
    else setEntries(prev => prev.filter(item => item.id !== entry.id))
  }

  if (authLoading) return <div className="state">Vérification de l’accès...</div>
  if (!isAdmin) return <main className="page"><div className="container"><header className="header"><Link to="/" className="brand">MIMOU <span>BOOKISM</span></Link></header><div className="empty-card"><h2>Accès réservé</h2><p>Cette page est réservée à l’administrateur.</p><Link to="/admin" className="btn primary">Aller à l’administration</Link></div></div></main>

  return (
    <main className="page">
      <div className="container">
        <header className="header"><Link to="/" className="brand">MIMOU <span>BOOKISM</span></Link><nav className="nav"><Link to="/dictionnaire" className="btn">📖 Voir le dictionnaire</Link><Link to="/admin" className="btn">← Administration</Link></nav></header>
        <section className="dashboard-hero admin-hero"><div><p className="eyebrow">MIMOU DICTIONNAIRE</p><h1>{editing ? 'Modifier un mot' : 'Gérer le dictionnaire'}</h1><p>Ajoute les mots difficiles et les termes manga que les lecteurs doivent comprendre.</p></div></section>
        {error && <div className="notice error-box">{error}</div>}
        <form onSubmit={saveEntry} className="form-card wide">
          <div className="form-row"><label className="field"><span>Mot ou expression</span><input value={form.word} onChange={e => updateField('word', e.target.value)} placeholder="Ex. Nakama" required /></label><label className="field"><span>Catégorie</span><select value={form.type} onChange={e => updateField('type', e.target.value)}><option>Mot difficile</option><option>Terme manga</option><option>Culture manga</option><option>Expression japonaise</option></select></label></div>
          <label className="field"><span>Définition simple</span><textarea rows="4" value={form.definition} onChange={e => updateField('definition', e.target.value)} placeholder="Explique le mot avec des mots simples..." required /></label>
          <label className="field"><span>Exemple</span><textarea rows="3" value={form.example} onChange={e => updateField('example', e.target.value)} placeholder="Donne un exemple pour aider le lecteur..." /></label>
          <label className="field"><span>Tags séparés par des virgules</span><input value={form.tags} onChange={e => updateField('tags', e.target.value)} placeholder="Japonais, Manga, Culture" /></label>
          <div className="hero-actions"><button type="submit" className="btn primary" disabled={saving}>{saving ? 'Enregistrement...' : editing ? 'Enregistrer les modifications' : 'Ajouter au dictionnaire'}</button>{editing && <button type="button" className="btn" onClick={resetForm}>Annuler</button>}</div>
        </form>
        <section style={{ marginTop: 38 }}><div className="catalogue-heading"><div><p className="section-kicker">ENTRÉES</p><h2>{filtered.length} mot{filtered.length !== 1 ? 's' : ''}</h2></div><input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔎 Rechercher..." aria-label="Rechercher un mot" /></div>
          {loading ? <div className="state">Chargement...</div> : filtered.length === 0 ? <div className="empty-card"><h2>Aucune entrée</h2><p>Ajoute ton premier mot ci-dessus.</p></div> : <div className="admin-list">{filtered.map(entry => <article className="admin-row" key={entry.id}><div className="admin-info"><span className="badge">{entry.type}</span><h2>{entry.word}</h2><p>{entry.definition}</p><small>{Array.isArray(entry.tags) ? entry.tags.join(' · ') : ''}</small></div><div className="admin-actions"><button type="button" className="btn" onClick={() => startEdit(entry)}>Modifier</button><button type="button" className="btn danger" onClick={() => deleteEntry(entry)}>Supprimer</button></div></article>)}</div>}
        </section>
      </div>
    </main>
  )
}
