import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <section>
      <h1>Chess++</h1>
      <p>A skeleton front-end for the egg-chess app, built with React, TypeScript, and Vite.</p>
      <p>
        Head over to the <Link to="/play">Play</Link> page to see the board, or <Link to="/login">log in</Link> to get
        started.
      </p>
    </section>
  );
}
