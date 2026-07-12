/**
 * Small bespoke primitives for the shell (ADR-003 §6): buttons, pills,
 * chips, toggles, popover menus, and the modal scaffold. All styling comes
 * from the token custom properties in tokens.css.
 */

import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from "react";
import { XIcon } from "./icons";
import type { RunStatus } from "../storage";

export const MONO =
  '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

// --- Buttons ----------------------------------------------------------------

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
};

export const PrimaryButton = ({ style, children, ...rest }: ButtonProps) => (
  <button
    className="shell-primary-hover"
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "9px 14px",
      borderRadius: 10,
      border: "none",
      background: "var(--accent)",
      color: "#fff",
      fontWeight: 700,
      fontSize: 13,
      cursor: rest.disabled ? "not-allowed" : "pointer",
      fontFamily: "inherit",
      opacity: rest.disabled ? 0.55 : 1,
      ...style,
    }}
    {...rest}
  >
    {children}
  </button>
);

export const GhostButton = ({ style, children, ...rest }: ButtonProps) => (
  <button
    className="shell-hoverable"
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "9px 14px",
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "transparent",
      color: "var(--text)",
      fontWeight: 600,
      fontSize: 13,
      cursor: rest.disabled ? "not-allowed" : "pointer",
      fontFamily: "inherit",
      opacity: rest.disabled ? 0.55 : 1,
      ...style,
    }}
    {...rest}
  >
    {children}
  </button>
);

export const DangerButton = ({ style, children, ...rest }: ButtonProps) => (
  <button
    className="shell-danger-hover"
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "9px 18px",
      borderRadius: 10,
      border: "none",
      background: "var(--bad)",
      color: "#fff",
      fontWeight: 700,
      fontSize: 13,
      cursor: "pointer",
      fontFamily: "inherit",
      ...style,
    }}
    {...rest}
  >
    {children}
  </button>
);

/** 28px square icon action used in table rows. */
export const RowIconButton = ({
  hover = "shell-icon-hover",
  style,
  children,
  ...rest
}: ButtonProps & { hover?: string }) => (
  <button
    className={hover}
    style={{
      width: 28,
      height: 28,
      borderRadius: 7,
      border: "none",
      background: "transparent",
      color: "var(--text-3)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      ...style,
    }}
    {...rest}
  >
    {children}
  </button>
);

// --- Pills / chips ----------------------------------------------------------

export const RunningPill = ({ label = "Running" }: { label?: string }) => (
  <span
    data-testid="running-pill"
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "3px 10px",
      borderRadius: 999,
      background: "var(--good-soft)",
      color: "var(--good)",
      fontSize: 11.5,
      fontWeight: 700,
      flexShrink: 0,
    }}
  >
    <span
      className="shell-pulse"
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: "var(--good)",
      }}
    />
    {label}
  </span>
);

export function statusPillColors(status: RunStatus | "queued" | "external"): {
  bg: string;
  color: string;
  label: string;
} {
  switch (status) {
    case "running":
      return { bg: "var(--good-soft)", color: "var(--good)", label: "Running" };
    case "completed":
      return { bg: "var(--chip)", color: "var(--text-2)", label: "Completed" };
    case "failed":
      return { bg: "var(--bad-soft)", color: "var(--bad)", label: "Failed" };
    case "canceled":
      return { bg: "var(--chip)", color: "var(--text-3)", label: "Canceled" };
    case "interrupted":
      return { bg: "var(--bad-soft)", color: "var(--warn)", label: "Interrupted" };
    case "queued":
      return { bg: "var(--chip)", color: "var(--text-3)", label: "Queued" };
    case "external":
      return { bg: "var(--chip)", color: "var(--text-3)", label: "External run" };
  }
}

export const StatusPill = ({
  status,
}: {
  status: RunStatus | "queued" | "external";
}) => {
  const { bg, color, label } = statusPillColors(status);
  return (
    <span
      data-testid={`status-pill-${status}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: 999,
        background: bg,
        color,
        fontSize: 11.5,
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
};

export const Chip = ({
  children,
  accent = false,
  mono = false,
  style,
}: {
  children: ReactNode;
  accent?: boolean;
  mono?: boolean;
  style?: CSSProperties;
}) => (
  <span
    style={{
      padding: "2px 8px",
      borderRadius: 6,
      background: accent ? "var(--accent-soft)" : "var(--chip)",
      color: accent ? "var(--accent)" : "var(--text-2)",
      fontSize: 11,
      fontWeight: accent ? 700 : 600,
      flexShrink: 0,
      fontFamily: mono ? MONO : undefined,
      ...style,
    }}
  >
    {children}
  </span>
);

export const ColorDot = ({
  color,
  size = 9,
}: {
  color?: string;
  size?: number;
}) => (
  <span
    style={{
      width: size,
      height: size,
      borderRadius: 3,
      background: color ?? "var(--accent)",
      flexShrink: 0,
    }}
  />
);

export const PulseDot = ({ size = 7 }: { size?: number }) => (
  <span
    className="shell-pulse"
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: "var(--good)",
      flexShrink: 0,
    }}
  />
);

// --- Toggle switch ----------------------------------------------------------

export const ToggleSwitch = ({
  on,
  onToggle,
  ...rest
}: {
  on: boolean;
  onToggle: () => void;
} & Omit<ButtonProps, "onClick">) => (
  <button
    onClick={onToggle}
    role="switch"
    aria-checked={on}
    style={{
      width: 38,
      height: 22,
      borderRadius: 999,
      border: "none",
      cursor: "pointer",
      position: "relative",
      flexShrink: 0,
      padding: 0,
      transition: "background .15s",
      background: on ? "var(--accent)" : "var(--border-strong)",
    }}
    {...rest}
  >
    <span
      style={{
        position: "absolute",
        top: 3,
        left: on ? 19 : 3,
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: "#fff",
        transition: "left .15s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
      }}
    />
  </button>
);

// --- Popover menu -----------------------------------------------------------

export const Popover = ({
  open,
  onClose,
  children,
  minWidth = 216,
  testId,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  minWidth?: number;
  testId?: string;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) {
      return;
    }
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    // Defer so the opening click doesn't immediately close it.
    const id = setTimeout(() => document.addEventListener("mousedown", onDown));
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, onClose]);
  if (!open) {
    return null;
  }
  return (
    <div
      ref={ref}
      data-testid={testId}
      style={{
        position: "absolute",
        top: "calc(100% + 6px)",
        right: 0,
        zIndex: 100,
        minWidth,
        background: "var(--surface)",
        border: "1px solid var(--border-strong)",
        borderRadius: 12,
        boxShadow: "var(--shadow)",
        padding: 6,
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      {children}
    </div>
  );
};

export const MenuItem = ({
  label,
  hint,
  danger = false,
  onClick,
  testId,
}: {
  label: string;
  hint?: string;
  danger?: boolean;
  onClick: () => void;
  testId?: string;
}) => (
  <button
    onClick={onClick}
    data-testid={testId}
    className="shell-hoverable"
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 1,
      padding: "8px 11px",
      borderRadius: 8,
      border: "none",
      background: "transparent",
      color: danger ? "var(--bad)" : "var(--text)",
      fontWeight: 600,
      fontSize: 13,
      cursor: "pointer",
      fontFamily: "inherit",
      textAlign: "left",
      width: "100%",
    }}
  >
    {label}
    {hint && (
      <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-3)" }}>
        {hint}
      </span>
    )}
  </button>
);

export const MenuDivider = () => (
  <div style={{ height: 1, background: "var(--border)", margin: "4px 6px" }} />
);

// --- Modal scaffold ---------------------------------------------------------

export const ModalShell = ({
  open,
  onClose,
  title,
  maxWidth = 540,
  children,
  headerExtra,
  testId,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  maxWidth?: number;
  children: ReactNode;
  headerExtra?: ReactNode;
  testId?: string;
}) => {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) {
    return null;
  }
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(4,6,10,0.6)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: 24,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        data-testid={testId}
        role="dialog"
        aria-label={title}
        style={{
          width: "100%",
          maxWidth,
          maxHeight: "calc(100vh - 48px)",
          overflowY: "auto",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 18,
          boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
          animation: "shell-fade-up .2s ease",
        }}
      >
        {title !== undefined && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 24px 0",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              {title}
            </h3>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {headerExtra}
              <button
                onClick={onClose}
                aria-label="Close"
                className="shell-hoverable shell-hoverable-text"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-3)",
                  cursor: "pointer",
                  display: "flex",
                  padding: 4,
                  borderRadius: 6,
                }}
              >
                <XIcon />
              </button>
            </span>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

// --- Prompt / confirm helpers ------------------------------------------------

export const PromptModal = ({
  open,
  title,
  note,
  initialValue = "",
  placeholder,
  confirmLabel = "Save",
  mono = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  note?: ReactNode;
  initialValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  mono?: boolean;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}) => {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    if (open) {
      setValue(initialValue);
    }
  }, [open, initialValue]);
  if (!open) {
    return null;
  }
  const confirm = () => {
    if (value.trim()) {
      onConfirm(value.trim());
    }
  };
  return (
    <ModalShell open={open} onClose={onCancel} maxWidth={420} testId="prompt-modal">
      <div style={{ padding: "20px 22px 22px" }}>
        <h3
          style={{
            margin: "0 0 16px",
            fontSize: 17,
            fontWeight: 700,
            color: "var(--text)",
          }}
        >
          {title}
        </h3>
        <input
          className="shell-input"
          autoFocus
          data-testid="prompt-input"
          value={value}
          placeholder={placeholder}
          style={mono ? { fontFamily: MONO, fontSize: 13 } : undefined}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              confirm();
            }
          }}
        />
        {note && (
          <div
            style={{
              fontSize: 11.5,
              color: "var(--text-3)",
              lineHeight: 1.5,
              marginTop: 8,
            }}
          >
            {note}
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 18,
          }}
        >
          <GhostButton onClick={onCancel}>Cancel</GhostButton>
          <PrimaryButton
            onClick={confirm}
            disabled={!value.trim()}
            data-testid="prompt-confirm"
          >
            {confirmLabel}
          </PrimaryButton>
        </div>
      </div>
    </ModalShell>
  );
};

export const ConfirmModal = ({
  open,
  title,
  body,
  confirmLabel = "Delete",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  if (!open) {
    return null;
  }
  return (
    <ModalShell open={open} onClose={onCancel} maxWidth={420} testId="confirm-modal">
      <div style={{ padding: "20px 22px 22px" }}>
        <h3
          style={{
            margin: "0 0 6px",
            fontSize: 17,
            fontWeight: 700,
            color: "var(--text)",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: "10px 0 18px",
            fontSize: 13,
            color: "var(--text-2)",
            lineHeight: 1.6,
          }}
        >
          {body}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <GhostButton onClick={onCancel}>Cancel</GhostButton>
          <DangerButton onClick={onConfirm} data-testid="confirm-delete">
            {confirmLabel}
          </DangerButton>
        </div>
      </div>
    </ModalShell>
  );
};

// --- Section label ----------------------------------------------------------

export const SectionLabel = ({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) => (
  <span
    style={{
      fontSize: 11.5,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      color: "var(--text-3)",
      ...style,
    }}
  >
    {children}
  </span>
);
