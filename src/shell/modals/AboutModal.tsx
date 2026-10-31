/**
 * About Atomify: where the source lives, who made it, and how to get help.
 * Opened from the sidebar footer.
 */

import type { ReactNode } from "react";
import { ExternalIcon } from "../icons";
import { ModalShell } from "../ui";

export const SOURCE_URL = "https://github.com/andeplane/atomify";
export const ISSUES_URL = "https://github.com/andeplane/atomify/issues";
export const AUTHOR_NAME = "Anders Hafreager";
export const AUTHOR_URL = "https://andeplane.github.io";
export const CONTACT_EMAIL = "andershaf@gmail.com";

const linkStyle = {
  color: "var(--accent)",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontWeight: 600,
};

const ExternalLink = ({
  href,
  children,
  testId,
}: {
  href: string;
  children: ReactNode;
  testId?: string;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    data-testid={testId}
    style={linkStyle}
  >
    {children}
    <ExternalIcon size={12} />
  </a>
);

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "92px 1fr",
      gap: 12,
      padding: "12px 0",
      borderTop: "1px solid var(--border)",
      fontSize: 13.5,
      alignItems: "baseline",
    }}
  >
    <span style={{ color: "var(--text-3)", fontWeight: 600 }}>{label}</span>
    <div
      style={{
        color: "var(--text-2)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {children}
    </div>
  </div>
);

const AboutModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => (
  <ModalShell
    open={open}
    onClose={onClose}
    title="About Atomify"
    testId="about-modal"
    maxWidth={480}
  >
    <div style={{ padding: "12px 24px 22px" }}>
      <p
        style={{
          margin: "0 0 16px",
          fontSize: 13.5,
          lineHeight: 1.55,
          color: "var(--text-2)",
        }}
      >
        Atomify runs LAMMPS molecular dynamics simulations entirely in your
        browser. It is free and open source.
      </p>
      <Row label="Source code">
        <ExternalLink href={SOURCE_URL} testId="about-source">
          github.com/andeplane/atomify
        </ExternalLink>
      </Row>
      <Row label="Author">
        <ExternalLink href={AUTHOR_URL} testId="about-author">
          {AUTHOR_NAME}
        </ExternalLink>
      </Row>
      <Row label="Get help">
        <ExternalLink href={ISSUES_URL} testId="about-issues">
          Report a bug or ask a question on GitHub
        </ExternalLink>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          data-testid="about-email"
          style={linkStyle}
        >
          {CONTACT_EMAIL}
        </a>
      </Row>
    </div>
  </ModalShell>
);

export default AboutModal;
