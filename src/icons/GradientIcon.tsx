import { useId } from "react";
import SvgIcon, { type SvgIconProps } from "@mui/material/SvgIcon";
import type { IconArt } from "./paths.generated";

/**
 * Renders icon art with a metallic gradient derived from the icon's own color.
 *
 * The gradient lives INSIDE this instance's <svg>, which is the whole trick:
 * `currentColor` in a gradient stop resolves against the element it is declared
 * on, so a gradient in a shared document-level <defs> would resolve against
 * that <defs> and every icon would come out the same fixed color. Declared here
 * it picks up whatever `color` this icon inherited — so all the existing
 * `color: ACCENT_PRIMARY` / `TEXT_MUTED` call sites keep working and simply
 * gain a gradient, with no per-icon configuration.
 *
 * `useId()` gives each instance a unique gradient id, which is what makes
 * per-instance <defs> safe — duplicate ids in one document resolve to the first
 * match, so without this every icon would silently take the first one's ramp.
 *
 * The two mix amounts come from --g-light / --g-dark (see theme/tokens.ts), so
 * how metallic the whole app reads is one knob.
 */
export function GradientIcon({
  art,
  opticalScale = 1,
  rotateDeg = 0,
  ...props
}: { art: IconArt; opticalScale?: number; rotateDeg?: number } & SvgIconProps) {
  const id = useId();

  // Size and rotation are applied about the viewBox centre, so art stays centred
  // whatever the correction. Named `opticalScale`, not `scale`: SvgIconProps
  // already carries `scale` and `rotate` SVG attributes and they would collide.
  // See ICON_SCALE / ICON_ROTATE in ./index.tsx.
  const [minX, minY, w, h] = art.viewBox.split(/[\s,]+/).map(Number);
  const cx = minX + w / 2;
  const cy = minY + h / 2;
  const ops = [
    rotateDeg !== 0 && `rotate(${rotateDeg})`,
    opticalScale !== 1 && `scale(${opticalScale})`,
  ].filter(Boolean);
  const transform = ops.length
    ? `translate(${cx} ${cy}) ${ops.join(" ")} translate(${-cx} ${-cy})`
    : undefined;

  return (
    <SvgIcon viewBox={art.viewBox} {...props}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="color-mix(in oklab, currentColor, white var(--g-light))" />
          <stop offset="52%" stopColor="currentColor" />
          <stop offset="100%" stopColor="color-mix(in oklab, currentColor, black var(--g-dark))" />
        </linearGradient>
      </defs>
      <g transform={transform}>
        {art.d.map((d, i) => (
          <path key={i} fill={`url(#${id})`} d={d} />
        ))}
      </g>
    </SvgIcon>
  );
}

export default GradientIcon;
