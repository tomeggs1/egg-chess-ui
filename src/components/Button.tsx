import { Button as MuiButton } from "@mui/material";
import { CTA_PRIMARY, TEXT_MUTED } from "../constants";

interface IButtonProps {
  id: string;
  type: "primary" | "secondary" | "tertiary";
  onClick?: any;
  label?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  isSubmit?: boolean;
  isDisabled?: boolean;
  style?: any;
  form?: string;
  buttonRef?: any;
  tooltipTitle?: string;
  children?: React.ReactNode;
  to?: string;
}

// Sizing, radius, weight and sentence-casing now come from the MuiButton
// defaults in theme/muiTheme.ts — this wrapper only adds the gradient sheen and
// the caller-supplied base color on top.

// Slight top-to-bottom sheen. Uses translucent white/black so it tints
// whatever base color is applied, rather than a fixed color.
const gradientOverlay = "linear-gradient(180deg, rgba(255, 255, 255, 0.14) 0%, rgba(0, 0, 0, 0.14) 100%)";
// Brighter highlight on hover — still tints any base color.
const gradientOverlayHover = "linear-gradient(180deg, rgba(255, 255, 255, 0.28) 0%, rgba(0, 0, 0, 0.08) 100%)";

export const Button: React.FC<IButtonProps> = ({ ...props }) => {
  const baseColor = props.style?.backgroundColor ?? CTA_PRIMARY;

  return (
    <MuiButton
      onClick={props.onClick}
      variant="contained"
      style={{
        ...props.style,
        backgroundColor: props.isDisabled ? "rgba(0, 0, 0, 0.05)" : baseColor,
        // White unless the caller asked for something else. A light base color
        // (e.g. the medieval gold) needs dark text, and this used to override
        // `props.style.color` because it was applied after the spread.
        color: props.isDisabled ? TEXT_MUTED : (props.style?.color ?? "white"),
      }}
      sx={{
        backgroundImage: gradientOverlay,
        transition: "background-image 0.15s ease, box-shadow 0.15s ease",
        "&:hover": {
          backgroundColor: baseColor,
          backgroundImage: gradientOverlayHover,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.35)",
        },
      }}
      startIcon={props.startIcon}
      endIcon={props.endIcon}
      disabled={props.isDisabled}
      type={props.isSubmit ? "submit" : "button"}
      form={props.form}
      ref={props.buttonRef}
    >
      {props.label ? props.label : props.children}
    </MuiButton>
  );
};
