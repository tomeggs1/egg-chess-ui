import { MenuItem, Menu as MuiMenu } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { SvgIconComponent } from "@mui/icons-material";
import { MAIN_BLUE } from "../constants";

export interface MenuOption {
  label: string;
  to?: string;
  onClick?: () => void;
  icon?: SvgIconComponent;
  iconColor?: string;
}

interface IMenuProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  items: MenuOption[];
  anchorOrigin?: { vertical: "top" | "bottom" | "center"; horizontal: "left" | "right" | "center" };
  transformOrigin?: { vertical: "top" | "bottom" | "center"; horizontal: "left" | "right" | "center" };
}

export const Menu: React.FC<IMenuProps> = ({ open, anchorEl, onClose, items, anchorOrigin, transformOrigin }) => {
  const navigate = useNavigate();

  return (
    <MuiMenu
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      // Flyout to the right of the sidebar item.
      anchorOrigin={anchorOrigin ?? { vertical: "top", horizontal: "right" }}
      transformOrigin={transformOrigin ?? { vertical: "top", horizontal: "left" }}
      sx={{ fontFamily: "unset", "& .MuiPaper-root": { backgroundColor: MAIN_BLUE, color: "white" } }}
    >
      {items.map(({ label, to, onClick, icon: Icon, iconColor }) => (
        <MenuItem
          key={label}
          onClick={() => {
            if (to) navigate(to);
            onClick?.();
            onClose();
          }}
          sx={{ color: "white", gap: "10px" }}
        >
          {Icon && <Icon fontSize="small" htmlColor={iconColor} />}
          {label}
        </MenuItem>
      ))}
    </MuiMenu>
  );
};
