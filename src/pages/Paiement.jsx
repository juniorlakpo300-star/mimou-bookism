import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { useAuth } from '../AuthContext.jsx'

export default function Paiement() {
  const { user, loading: authLoading } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const bookId = params.get('book')
  const transaction = params.get('transaction')
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [status, setStatus] = useState(transaction ? 'checking' : '')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) navigate('/connexion', { replace: true })
  }, [user, authLoading, navigate])

  useEffect(() => {
    async function loadBook() {
      if (!bookId) {
        setLoading(false)
        return
      }
      const { data, error: bookError } = await supabase
        .from('books')
        .select('id,title,author,price,is_free,cover_url,description')
        .eq('id', bookId)
        .single()
      if (bookError) setError(bookError.message)
      else setBook(data)
      setLoading(false)
    }
    loadBook()
  }, [bookId])

  useEffect(() => {
    if (!transaction || !user) return

    let cancelled = false
    let timer

    async function check() {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token
        if (!accessToken) throw new Error('Session expirée. Reconnecte-toi.')

        const response = await fetch('/api/payment-check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({ transactionId: transaction })
        })
        const result = await response.json()
        if (cancelled) return
        if (result.status === 'PAID') {
          setStatus('paid')
          return
        }
        if (result.status === 'FAILED') {
          setStatus('failed')
          return
        }
        setStatus('checking')
        timer = setTimeout(check, 4000)
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Impossible de vérifier le paiement.')
          setStatus('failed')
        }
      }
    }

    check()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [transaction, user])

  async function startPayment() {
    if (!user || !book) return
    setPaying(true)
    setError('')
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) throw new Error('Session expirée. Reconnecte-toi.')

      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ bookId: book.id })
      })
      const result = await response.json()
      if (!response.ok) {
        if (result.alreadyPaid) {
          navigate(`/read/${book.id}`)
          return
        }
        throw new Error(result.error || 'Impossible de démarrer le paiement.')
      }
      window.location.href = result.paymentUrl
    } catch (err) {
      setError(err.message || 'Erreur de paiement.')
      setPaying(false)
    }
  }

  if (authLoading || loading) return <div className="state">Chargement...</div>
  if (!user) return null
  if (error && !book) return <div className="state error">Erreur : {error}</div>
  if (!book) return <div className="state">Livre introuvable.</div>

  if (status === 'paid') {
    return (
      <main className="form-page">
        <div className="form-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 52 }}>✅</div>
          <h1>Paiement confirmé</h1>
          <p className="form-intro">Ton achat de « {book.title} » est enregistré. Tu peux maintenant lire le livre.</p>
          <Link className="btn primary" to={`/read/${book.id}`}>📖 Lire le livre</Link>
        </div>
      </main>
    )
  }

  if (transaction && status === 'failed') {
    return (
      <main className="form-page">
        <div className="form-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 52 }}>❌</div>
          <h1>Paiement non confirmé</h1>
          <p className="form-intro">La transaction n’a pas été validée. Tu peux recommencer.</p>
          <Link className="btn primary" to={`/paiement?book=${book.id}`}>Réessayer</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="form-page">
      <div className="form-card" style={{ maxWidth: 620, margin: '0 auto' }}>
        <Link to={`/read/${book.id}`} className="btn">← Retour au livre</Link>
        <h1 style={{ marginTop: 20 }}>Acheter ce livre</h1>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', margin: '24px 0' }}>
          <img src={book.cover_url} alt={`Couverture de ${book.title}`} style={{ width: 110, height: 150, objectFit: 'cover', borderRadius: 12 }} />
          <div>
            <h2>{book.title}</h2>
            <p className="muted">{book.author || 'Auteur inconnu'}</p>
            <strong style={{ fontSize: 24 }}>{Math.round(Number(book.price || 0)).toLocaleString('fr-FR')} FCFA</strong>
          </div>
        </div>

        {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}

        <div style={{ padding: 18, borderRadius: 14, background: 'rgba(255,255,255,.04)', marginBottom: 20 }}>
          <strong>💳 Paiement sécurisé</strong>
          <p className="muted" style={{ marginBottom: 0 }}>
            Le guichet de paiement te permettra d’utiliser les moyens disponibles sur le service MIMOU BOOKISM, notamment <strong>MTN Money</strong> et <strong>Wave</strong> en Côte d’Ivoire.
          </p>
        </div>

        <button className="btn primary full" onClick={startPayment} disabled={paying}>
          {paying ? 'Ouverture du paiement...' : 'Payer avec MTN Money / Wave'}
        </button>
        <p className="muted" style={{ textAlign: 'center', marginTop: 14 }}>
          Après confirmation, le livre sera débloqué sur ton compte.
        </p>
      </div>
    </main>
  )
}
