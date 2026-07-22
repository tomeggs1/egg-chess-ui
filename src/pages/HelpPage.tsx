import { Link } from "react-router-dom";
import { APP_NAME } from "../constants";

type HelpTopic = {
  question: string;
  answer: React.ReactNode;
};

const topics: HelpTopic[] = [
  {
    question: "How do I start playing?",
    answer: (
      <>
        Head to the <Link to="/play">Play</Link> page. You can challenge{" "}
        <Link to="/play/online">another user</Link> or practice against a{" "}
        <Link to="/play/bot">bot</Link>.
      </>
    ),
  },
  {
    question: "Do I need an account?",
    answer: (
      <>
        You can explore the board without one, but you'll need to{" "}
        <Link to="/login">log in</Link> (or sign up) to save games, track your rating, and appear
        on the <Link to="/rankings">rankings</Link>.
      </>
    ),
  },
  {
    question: "What are puzzles?",
    answer: (
      <>
        Puzzles are short tactical challenges. Try the{" "}
        <Link to="/puzzles/daily">Daily Puzzle</Link> for a fresh one each day, or work through{" "}
        <Link to="/puzzles/random">Random Puzzles</Link> at your own pace.
      </>
    ),
  },
  {
    question: "How is my rating calculated?",
    answer:
      "Your rating updates after each rated game based on the result and your opponent's rating — win against stronger players to climb faster.",
  },
  {
    question: "I'm new to chess. Where do I start?",
    answer: (
      <>
        Visit <Link to="/learn">Learn Chess</Link> for the basics: how the pieces move, common
        openings, and core tactics.
      </>
    ),
  },
];

export default function HelpPage() {
  return (
    <section>
      <h1>Help &amp; Support</h1>
      <p>Answers to common questions about playing on {APP_NAME}.</p>

      <h2>Frequently asked questions</h2>
      <dl>
        {topics.map(({ question, answer }) => (
          <div key={question} style={{ marginBottom: "1rem" }}>
            <dt style={{ fontWeight: 600 }}>{question}</dt>
            <dd style={{ margin: "0.25rem 0 0" }}>{answer}</dd>
          </div>
        ))}
      </dl>

      <h2>Still need help?</h2>
      <p>
        Reach out to our team at{" "}
        <a href="mailto:support@hpchess.example">support@hpchess.example</a> and we'll
        get back to you.
      </p>
    </section>
  );
}
