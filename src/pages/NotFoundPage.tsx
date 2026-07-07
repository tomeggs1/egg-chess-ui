import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section>
      <h1>404</h1>
      <p>That page doesn’t exist.</p>
      <p>
        <Link to="/">Back home</Link>
      </p>
    </section>
  )
}
