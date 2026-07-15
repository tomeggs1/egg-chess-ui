import { Button as MuiButton } from "@mui/material";
import { MAIN_BLUE, TEXT_MUTED } from "../constants";

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

const buttonStyle = {
  textTransform: "none",
  borderRadius: "8px",
  padding: "8px 16px",
  fontSize: "14px",
  fontWeight: 500,
  lineHeight: "20px",
  fontFamily: "unset",
};

// Slight top-to-bottom sheen. Uses translucent white/black so it tints
// whatever base color is applied, rather than a fixed color.
const gradientOverlay = "linear-gradient(180deg, rgba(255, 255, 255, 0.14) 0%, rgba(0, 0, 0, 0.14) 100%)";
// Brighter highlight on hover — still tints any base color.
const gradientOverlayHover = "linear-gradient(180deg, rgba(255, 255, 255, 0.28) 0%, rgba(0, 0, 0, 0.08) 100%)";

export const Button: React.FC<IButtonProps> = ({ ...props }) => {
  const baseColor = props.style?.backgroundColor ?? MAIN_BLUE;

  return (
    <MuiButton
      onClick={props.onClick}
      variant="contained"
      style={{
        ...buttonStyle,
        ...props.style,
        backgroundColor: props.isDisabled ? "rgba(0, 0, 0, 0.05)" : baseColor,
        color: props.isDisabled ? TEXT_MUTED : "white",
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
