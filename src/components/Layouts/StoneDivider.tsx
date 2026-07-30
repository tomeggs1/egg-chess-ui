import Box from "@mui/material/Box";
import { DIVIDER } from "../../theme/tokens";

/**
 * The carved stone pillar between the nav rail and the page.
 *
 * It is a flex *sibling* of <NavBar />, not a child positioned against its
 * edge. That buys three things:
 *
 *   - the nav scrolls (`overflowY: auto`), and an absolutely-positioned child
 *     of a scrolling box sizes to the content, not the viewport — so a pillar
 *     inside the rail would scroll away on a short window;
 *   - it needs no knowledge of the 230 <-> 72px collapse, and no matching
 *     0.2s transition, because flex re-flows it for free;
 *   - it sits beside the rail's scrollbar rather than under it.
 *
 * Purely decorative, so it is hidden from assistive tech.
 */
export default function StoneDivider() {
  const slice = (image: string) => ({
    backgroundImage: `url(${image})`,
    backgroundSize: "100% 100%",
    backgroundRepeat: "no-repeat",
    flex: "0 0 auto",
  });

  return (
    <Box
      aria-hidden
      sx={{
        flex: `0 0 ${DIVIDER.width}px`,
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        filter: DIVIDER.shadow,
        // Above the page content, below anything the app overlays on top.
        zIndex: 1,
      }}
    >
      <Box sx={{ ...slice(DIVIDER.art.top), height: DIVIDER.capTop }} />
      <Box
        sx={{
          // min-height:0 lets the shaft actually shrink; without it the flex
          // item floors at its background's intrinsic size and overflows.
          flex: "1 1 auto",
          minHeight: 0,
          backgroundImage: `url(${DIVIDER.art.middle})`,
          backgroundSize: `${DIVIDER.width}px ${DIVIDER.shaftTile}px`,
          backgroundRepeat: "repeat-y",
          backgroundPosition: "top center",
        }}
      />
      <Box sx={{ ...slice(DIVIDER.art.bottom), height: DIVIDER.capBottom }} />
    </Box>
  );
}
