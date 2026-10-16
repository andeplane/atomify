/**
 * The shell's modal scaffold (ADR-003 §6) and the prompt/confirm dialogs
 * built on it.
 */

import { useEffect, useState, type ReactNode } from "react";
import { XIcon } from "../icons";
import { DangerButton, GhostButton, MONO, PrimaryButton } from "./controls";

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
    <ModalShell
      open={open}
      onClose={onCancel}
      maxWidth={420}
      testId="prompt-modal"
    >
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
    <ModalShell
      open={open}
      onClose={onCancel}
      maxWidth={420}
      testId="confirm-modal"
    >
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
