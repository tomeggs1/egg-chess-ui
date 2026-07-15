import { useParams } from "react-router-dom";

/**
 * Placeholder game screen. The interactive board (custom React + engine) will
 * live here; for now it just confirms a game was created and navigated into.
 */
export default function GamePage() {
  const { gameId } = useParams();
  return (
    <section>
      <h1>Game {gameId}</h1>
      <p>The game board will go here.</p>
    </section>
  );
}
