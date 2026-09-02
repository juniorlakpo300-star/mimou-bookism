import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js'

export default function Connexion() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return alert(`Erreur : ${error.message}`)
    navigate('/catalogue')
  }

  return <main className="form-page"><div className="form-card">
    <Link to="/catalogue" className="btn">← Catalogue</Link>
    <h1>Connexion</h1>
    <p className="form-intro">Connecte-toi à ton compte MIMOU BOOKISM.</p>
    <form onSubmit={handleSubmit}>
      <label className="field"><span>E-mail</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
      <label className="field"><span>Mot de passe</span><input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
      <button className="btn primary full" disabled={loading}>{loading ? 'Connexion...' : 'Se connecter'}</button>
    </form>
    <p className="form-bottom">Pas encore de compte ? <Link to="/inscription">Créer un compte</Link></p>
  </div></main>
}
