"use client";

import { useState } from "react";

/* -------------------------
   Types
-------------------------- */
type ContactTime = "morning" | "afternoon" | "evening" | "anytime";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  contactTime: ContactTime | "";
  location: string;
  message: string;
  company: string; // honeypot
};

type Status = "idle" | "loading" | "success" | "error";

/* -------------------------
   Initial State
-------------------------- */
const INITIAL_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  contactTime: "",
  location: "",
  message: "",
  company: "",
};

/* -------------------------
   Component
-------------------------- */
export default function ContactForm() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [status, setStatus] = useState<Status>("idle");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");

    // Honeypot (silent success)
    if (form.company) {
      setStatus("success");
      return;
    }

    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_CONTACT_WEBHOOK_2 as string,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${form.firstName} ${form.lastName}`.trim(),
            email: form.email.trim().toLowerCase(),
            phone: form.phone.trim(),
            location: form.location.trim(),
            preferred_contact_time: form.contactTime,
            message: form.message.trim(),
            source: "general-contact-form",
          }),
        }
      );

      if (!res.ok) throw new Error("Request failed");

      setStatus("success");
      setForm(INITIAL_FORM);
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="section sectionHalo">
      <div
        className="container"
        style={{
          minHeight: "calc(100svh - 96px)", // adjust if nav height differs
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          className="featureCard"
          style={{
            width: "100%",
            maxWidth: 520,
            transform: "translateY(-8px)", // optical centering
          }}
        >
          {/* Header */}
          <div className="blockStack" style={{ textAlign: "center" }}>
            <span className="sectionLabel">Get in touch</span>

            <h2 className="h2">Let’s start a conversation</h2>

            <p className="p-lg">
              Share a few details and we’ll get back to you shortly.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="blockStack blockGapLg"
            style={{ marginTop: 28 }}
          >
            {/* Honeypot */}
            <input
              type="text"
              className="sr-only"
              tabIndex={-1}
              autoComplete="off"
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
            />

            {/* Name */}
            <div className="featureGrid">
              <input
                required
                className="input"
                placeholder="First name*"
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
              />
              <input
                className="input"
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
              />
            </div>

            {/* Contact */}
            <div className="featureGrid">
              <input
                required
                type="email"
                className="input"
                placeholder="Email address*"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
              <input
                required
                className="input"
                placeholder="Phone number*"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>

            {/* Location */}
            <input
              className="input"
              placeholder="Location (city / country)"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
            />

            {/* Contact time */}
            <select
              required
              className="input"
              value={form.contactTime}
              onChange={(e) =>
                update("contactTime", e.target.value as ContactTime)
              }
            >
              <option value="">Best time to contact*</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="anytime">Anytime</option>
            </select>

            {/* Message */}
            <textarea
              className="input"
              placeholder="Your message"
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
            />

            {/* Submit */}
            <button
              type="submit"
              className="btn btnPrimary"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Sending…" : "Send message"}
            </button>

            {/* Feedback */}
            {status === "success" && (
              <p
                className="p"
                style={{ color: "var(--success)", textAlign: "center" }}
              >
                Thanks — we’ll be in touch shortly.
              </p>
            )}

            {status === "error" && (
              <p
                className="p"
                style={{ color: "var(--error)", textAlign: "center" }}
              >
                Something went wrong. Please try again.
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
