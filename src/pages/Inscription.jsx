import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js'

export default function Inscription() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) return alert('Le mot de passe doit contenir au moins 6 caractères.')
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) return alert(`Erreur : ${error.message}`)
    if (data.session) navigate('/catalogue')
    else alert('Compte créé ! Vérifie ton e-mail si Supabase demande une confirmation.')
  }

  return <main className="form-page"><div className="form-card">
    <Link to="/catalogue" className="btn">← Catalogue</Link>
    <h1>Créer un compte</h1>
    <p className="form-intro">Rejoins la communauté MIMOU BOOKISM.</p>
    <form onSubmit={handleSubmit}>
      <label className="field"><span>E-mail</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
      <label className="field"><span>Mot de passe</span><input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength="6" required /></label>
      <button className="btn primary full" disabled={loading}>{loading ? 'Création...' : 'Créer mon compte'}</button>
    </form>
    <p className="form-bottom">Tu as déjà un compte ? <Link to="/connexion">Se connecter</Link></p>
  </div></main>
}
