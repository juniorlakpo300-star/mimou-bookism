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
    if (loading) return

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !password) return

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })
    setLoading(false)

    if (error) {
      const message = String(error.message || '').toLowerCase()

      if (message.includes('email rate limit exceeded')) {
        return alert('Le service e-mail de Supabase a atteint sa limite temporaire. La connexion par mot de passe ne demande normalement pas d’e-mail : ne reclique pas plusieurs fois et réessaie plus tard. Pour éviter définitivement cette limite sur MIMOU BOOKISM, il faut configurer un SMTP personnalisé dans Supabase.')
      }

      if (message.includes('invalid login credentials')) {
        return alert('E-mail ou mot de passe incorrect.')
      }

      if (message.includes('email not confirmed')) {
        return alert('Ton adresse e-mail n’est pas encore confirmée. Vérifie ta boîte mail avant de te connecter.')
      }

      return alert(`Erreur : ${error.message}`)
    }

    navigate('/catalogue')
  }

  return <main className="form-page"><div className="form-card">
    <Link to="/catalogue" className="btn">← Catalogue</Link>
    <h1>Connexion</h1>
    <p className="form-intro">Connecte-toi à ton compte MIMOU BOOKISM.</p>
    <form onSubmit={handleSubmit}>
      <label className="field"><span>E-mail</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required /></label>
      <label className="field"><span>Mot de passe</span><input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required /></label>
      <button className="btn primary full" disabled={loading}>{loading ? 'Connexion...' : 'Se connecter'}</button>
    </form>
    <p className="form-bottom">Pas encore de compte ? <Link to="/inscription">Créer un compte</Link></p>
  </div></main>
}
