import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Reader() {
  const { id } = useParams()

  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadBook() {
      try {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .eq('id', id)
          .single()

        if (error) {
          setError(error.message)
        } else {
          setBook(data)
        }
      } catch {
        setError('Erreur de connexion')
      } finally {
        setLoading(false)
      }
    }

    loadBook()
  }, [id])

  if (loading) {
    return <div style={{ padding: 50 }}>Chargement...</div>
  }

  if (error) {
    return <div style={{ padding: 50 }}>Erreur : {error}</div>
  }

  if (!book) {
    return <div style={{ padding: 50 }}>Livre introuvable</div>
  }

  return (
    <div style={{ padding: 50 }}>
      <h1>{book.title}</h1>

      <img
        src={book.cover_url || 'https://placehold.co/300x450?text=Livre'}
        alt={book.title}
        style={{ maxWidth: 300 }}
      />

      <p>{book.author}</p>
    </div>
  )
}