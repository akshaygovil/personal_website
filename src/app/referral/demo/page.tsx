"use client";

import { useState } from "react";

/* -------------------------
Types
-------------------------- */

type FormState = {
  clientName: string;
  phone: string;
  email: string;
  propertyPrice: string;
  deposit: string;
  notes: string;
  company: string;
};

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success" }
  | { type: "error"; message: string };

/* -------------------------
Initial State
-------------------------- */

const INITIAL_FORM: FormState = {
  clientName: "",
  phone: "",
  email: "",
  propertyPrice: "",
  deposit: "",
  notes: "",
  company: "",
};

/* -------------------------
Component
-------------------------- */

export default function ReferralPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [status, setStatus] = useState<Status>({ type: "idle" });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (status.type === "loading") return;

    setStatus({ type: "loading" });

    // Honeypot
    if (form.company) {
      setStatus({ type: "success" });
      return;
    }

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_REFERRAL_WEBHOOK_REFFERAL_DEMO as string, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_name: form.clientName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim().toLowerCase(),
          property_price: form.propertyPrice.trim(),
          deposit: form.deposit.trim(),
          notes: form.notes.trim(),
          source: "agent-referral-form",
        }),
      });

      if (!res.ok) {
        throw new Error("Request failed. Please try again.");
      }

      setStatus({ type: "success" });
      setForm(INITIAL_FORM);
    } catch (error) {
      console.error("Referral form error:", error);

      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <section className="section sectionHalo">
      <div
        className="container"
        style={{
          minHeight: "calc(100svh - 96px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <a
          href="/referral"
          style={{
            position: "fixed",
            top: 24,
            left: 24,
            fontSize: 14,
            opacity: 0.7
          }}
        >
          ← back
        </a>
        <div
          className="featureCard"
          style={{
            width: "100%",
            maxWidth: 520,
            transform: "translateY(-8px)",
          }}
        >
          <div className="blockStack" style={{ textAlign: "center" }}>
            <span className="sectionLabel">Client Referral</span>
            <h2 className="h2">Submit a client needing mortgage help</h2>
            <p className="p-lg">
              If your client needs help with financing or a home loan, submit
              their details below and we will contact them immediately.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="blockStack blockGapLg"
            style={{ marginTop: 28 }}
          >
            {/* Honeypot field */}
            <input
              type="text"
              className="sr-only"
              tabIndex={-1}
              autoComplete="off"
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
            />

            <input
              required
              className="input"
              placeholder="Client name*"
              value={form.clientName}
              onChange={(e) => update("clientName", e.target.value)}
            />

            <div className="featureGrid">
              <input
                required
                className="input"
                placeholder="Phone number*"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />

              <input
                required
                type="email"
                className="input"
                placeholder="Email address*"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>

            <div className="featureGrid">
              <input
                className="input"
                placeholder="Property price"
                value={form.propertyPrice}
                onChange={(e) => update("propertyPrice", e.target.value)}
              />

              <input
                className="input"
                placeholder="Deposit"
                value={form.deposit}
                onChange={(e) => update("deposit", e.target.value)}
              />
            </div>

            <textarea
              className="input"
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />

            <button
              type="submit"
              className="btn btnPrimary"
              disabled={status.type === "loading"}
            >
              {status.type === "loading" ? "Submitting…" : "Submit Referral"}
            </button>

            {status.type === "success" && (
              <p
                className="p"
                style={{ color: "var(--success)", textAlign: "center" }}
              >
                Referral submitted — we'll be in touch with your client shortly.
              </p>
            )}

            {status.type === "error" && (
              <p
                className="p"
                style={{ color: "var(--error)", textAlign: "center" }}
              >
                {status.message}
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
