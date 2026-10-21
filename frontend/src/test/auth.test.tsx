import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { sanitizeNextPath } from "@/features/auth/RequireAuth";
import { signupSchema, loginSchema } from "@/lib/schemas/auth";
import { RiskBadge } from "@/components/ui/risk-badge";
import type { RiskLevel } from "@/components/ui/risk-icons";

describe("Security: sanitizeNextPath", () => {
  it("allows safe internal relative paths", () => {
    expect(sanitizeNextPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeNextPath("/locations?sort=name")).toBe("/locations?sort=name");
    expect(sanitizeNextPath("/explore#map")).toBe("/explore#map");
  });

  it("rejects malicious open redirect vectors and protocol-relative paths", () => {
    expect(sanitizeNextPath("//attacker.com")).toBe("/dashboard");
    expect(sanitizeNextPath("https://phishing.example/")).toBe("/dashboard");
    expect(sanitizeNextPath("javascript:alert(1)")).toBe("/dashboard");
    expect(sanitizeNextPath(null)).toBe("/dashboard");
    expect(sanitizeNextPath(undefined)).toBe("/dashboard");
    expect(sanitizeNextPath("")).toBe("/dashboard");
  });
});

describe("Zod Validation: Auth Schemas", () => {
  it("enforces minimum 10 characters for password on signup", () => {
    const invalid = signupSchema.safeParse({
      email: "captain@example.com",
      display_name: "Captain Ahab",
      password: "short", // Only 5 chars
    });
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error.issues[0].message).toContain("at least 10 characters");
    }

    const valid = signupSchema.safeParse({
      email: "captain@example.com",
      display_name: "Captain Ahab",
      password: "StrongPassword123!",
      accepted_terms: true,
    });
    expect(valid.success).toBe(true);
  });

  it("strictly requires accepted_terms checkbox to be true on signup", () => {
    const missingTerms = signupSchema.safeParse({
      email: "captain@example.com",
      display_name: "Captain Ahab",
      password: "StrongPassword123!",
    });
    expect(missingTerms.success).toBe(false);

    const falseTerms = signupSchema.safeParse({
      email: "captain@example.com",
      display_name: "Captain Ahab",
      password: "StrongPassword123!",
      accepted_terms: false,
    });
    expect(falseTerms.success).toBe(false);
  });

  it("validates email formats strictly", () => {
    const invalid = loginSchema.safeParse({
      email: "not-an-email",
      password: "SomePassword123!",
    });
    expect(invalid.success).toBe(false);
  });
});

describe("Accessibility & Design: RiskBadge", () => {
  const levels: RiskLevel[] = ["safe", "caution", "unsafe", "unknown"];

  levels.forEach((lvl) => {
    it(`renders level '${lvl}' with icon, word, and accessible role`, () => {
      render(<RiskBadge level={lvl} />);
      const badge = screen.getByRole("status");
      expect(badge).toBeInTheDocument();
      // Verifies the word is always present (never colour alone)
      const expectedWord = lvl.charAt(0).toUpperCase() + lvl.slice(1);
      expect(badge).toHaveTextContent(expectedWord);
    });
  });
});
