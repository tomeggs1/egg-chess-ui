import { Link } from "react-router-dom";
import { Box, Stack, Typography } from "@mui/material";
import { ACCENT_PRIMARY, APP_NAME, TEXT_PRIMARY, TEXT_SECONDARY } from "../constants";
import HelpEmblem from "../assets/images/help-large.webp";

type HelpTopic = {
  question: string;
  answer: React.ReactNode;
};

const topics: HelpTopic[] = [
  {
    question: "How do I start playing?",
    answer: (
      <>
        Head to the <Link to="/play">Play</Link> page. You can challenge <Link to="/play/online">another user</Link> or
        practice against a <Link to="/play/bot">bot</Link>.
      </>
    ),
  },
  {
    question: "Do I need an account?",
    answer: (
      <>
        You can explore the board without one, but you'll need to <Link to="/login">log in</Link> (or sign up) to save
        games, track your rating, and appear on the <Link to="/rankings">rankings</Link>.
      </>
    ),
  },
  {
    question: "What are puzzles?",
    answer: (
      <>
        Puzzles are short tactical challenges. Try the <Link to="/puzzles/daily">Daily Puzzle</Link> for a fresh one
        each day, or work through <Link to="/puzzles/random">Random Puzzles</Link> at your own pace.
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
        Visit <Link to="/learn">Learn Chess</Link> for the basics: how the pieces move, common openings, and core
        tactics.
      </>
    ),
  },
];

export default function HelpPage() {
  return (
    <Stack direction="column" sx={{ gap: 1 }}>
      {/* Decorative — the heading beside it already names the page. */}
      <Stack direction="row" sx={{ alignItems: "center", gap: 2, mb: 2 }}>
        <Box
          component="img"
          src={HelpEmblem}
          alt=""
          aria-hidden
          sx={{ width: 72, height: 72, flexShrink: 0, objectFit: "contain", display: "block" }}
        />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
            Help &amp; Support
          </Typography>
          <Typography variant="body2" sx={{ color: TEXT_SECONDARY }}>
            Answers to common questions about playing on {APP_NAME}.
          </Typography>
        </Box>
      </Stack>

      <Typography variant="h6" sx={{ color: TEXT_PRIMARY }}>
        Frequently asked questions
      </Typography>
      <dl>
        {topics.map(({ question, answer }) => (
          <div key={question} style={{ marginBottom: "1rem" }}>
            <Box component="dt" sx={{ fontWeight: 600, color: TEXT_PRIMARY }}>
              {question}
            </Box>
            <Box component="dd" sx={{ m: "0.25rem 0 0", color: TEXT_SECONDARY }}>
              {answer}
            </Box>
          </div>
        ))}
      </dl>

      <Typography variant="h6" sx={{ color: TEXT_PRIMARY, mt: 2 }}>
        Still need help?
      </Typography>
      <Typography variant="body2" sx={{ color: TEXT_SECONDARY }}>
        Reach out to our team at{" "}
        <Box component="a" href="mailto:support@hpchess.com" sx={{ color: ACCENT_PRIMARY }}>
          support@hpchess.com
        </Box>{" "}
        and we&apos;ll get back to you.
      </Typography>
    </Stack>
  );
}
