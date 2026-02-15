"use client";

import { useEffect, useMemo, useState } from "react";

/* -------------------------
   Types
-------------------------- */
type Reason =
  | "general"
  | "project"
  | "automation"
  | "collaboration"
  | "other";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  reason: Reason;
  message: string;
  company: string; // honeypot
};

type Step =
  | "idle"
  | "received"
  | "validated"
  | "stored"
  | "classified"
  | "notified";

type Country = {
  code: string;
  name: string;
};

const INITIAL_FORM: FormState = {
  fullName: "",
  email: "",
  phone: "",
  country: "",
  reason: "general",
  message: "",
  company: "",
};

/* -------------------------
   Component
-------------------------- */
export function Contact() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [step, setStep] = useState<Step>("idle");

  const countries = useMemo(() => getAllCountries(), []);

  useEffect(() => {
    if (form.country) return;

    const detected = detectCountryName(countries);
    if (detected) {
      setForm((prev) => ({ ...prev, country: detected }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries]);

  function updateField<K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setStep("received");

    // Honeypot
    if (form.company) {
      setStatus("success");
      setStep("notified");
      return;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      // Demo workflow progression
      setTimeout(() => setStep("validated"), 400);
      setTimeout(() => setStep("stored"), 900);
      setTimeout(() => setStep("classified"), 1400);

      const res = await fetch(
        process.env.NEXT_PUBLIC_CONTACT_WEBHOOK as string,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            full_name: form.fullName.trim(),
            email: form.email.trim().toLowerCase(),
            phone: form.phone.trim(),
            country: form.country,
            reason: form.reason,
            message: form.message.trim(),
            source: "website",
            schema_version: 1,
          }),
        }
      );

      clearTimeout(timeout);

      if (!res.ok) throw new Error("Webhook failed");

      setStep("notified");
      setStatus("success");
      setForm(INITIAL_FORM);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setStep("idle");
    }
  }

  return (
    <section className="section sectionHalo" id="contact">
      <div className="container">
        <div className="sectionContent">
          <div className="featureCard contactCard">
            {/* LEFT */}
            <div>
              <h2 className="h2">Live automation demo</h2>

              <p className="p-lg blockGap">
                This form triggers a real production workflow built with
                <strong> n8n + Supabase</strong>.
              </p>

              <p className="p blockGap">
                Submit the form and watch how your message is validated, stored,
                classified, and routed automatically.
              </p>

              <WorkflowMap active={step} />

              <p className="p blockGap" style={{ color: "var(--text-2)" }}>
                This same system deploys to sales inboxes, support queues, and
                internal ops.
              </p>
            </div>

            {/* RIGHT */}
            <div>
              <h3 className="h3">Trigger the workflow</h3>

              <form
                onSubmit={handleSubmit}
                className="blockGapLg"
                style={{ display: "grid", gap: "var(--block-gap)" }}
              >
                {/* Honeypot */}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.company}
                  onChange={(e) => updateField("company", e.target.value)}
                  style={{ display: "none" }}
                />

                <Field label="Full name">
                  <input
                    required
                    className="input"
                    placeholder="John Smith"
                    value={form.fullName}
                    onChange={(e) =>
                      updateField("fullName", e.target.value)
                    }
                  />
                </Field>

                <Field label="Email">
                  <input
                    required
                    type="email"
                    className="input"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </Field>

                <Field label="Phone">
                  <input
                    type="tel"
                    className="input"
                    placeholder="+61 4XX XXX XXX"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </Field>                

                <Field label="Country">
                  <select
                    required
                    className="input"
                    value={form.country}
                    onChange={(e) => updateField("country", e.target.value)}
                  >
                    <option value="" disabled>
                      Select country
                    </option>

                    {countries.map(({ code, name }) => (
                      <option key={code} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Reason">
                  <select
                    className="input"
                    value={form.reason}
                    onChange={(e) =>
                      updateField("reason", e.target.value as Reason)
                    }
                  >
                    <option value="general">General enquiry</option>
                    <option value="project">Project</option>
                    <option value="automation">Automation / systems</option>
                    <option value="collaboration">Collaboration</option>
                  </select>
                </Field>

                <Field label="Message">
                  <textarea
                    required
                    rows={5}
                    className="input"
                    placeholder="Describe what you want to automate"
                    value={form.message}
                    onChange={(e) =>
                      updateField("message", e.target.value)
                    }
                  />
                </Field>

                <div style={{ display: "flex", gap: "var(--block-gap)" }}>
                  <button
                    type="submit"
                    className="btn btnPrimary"
                    disabled={status === "loading"}
                  >
                    {status === "loading"
                      ? "Processing…"
                      : "Run workflow"}
                  </button>

                  {status === "success" && (
                    <span className="p" style={{ color: "var(--success)" }}>
                      Workflow completed
                    </span>
                  )}

                  {status === "error" && (
                    <span className="p" style={{ color: "var(--error)" }}>
                      Something failed
                    </span>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------
   Workflow Map
-------------------------- */
function WorkflowMap({ active }: { active: Step }) {
  const steps: Step[] = [
    "received",
    "validated",
    "stored",
    "classified",
    "notified",
  ];

  const activeIndex = steps.indexOf(active);

  return (
    <div
      className="blockGapLg"
      style={{ display: "grid", gap: "var(--block-gap)" }}
    >
      {steps.map((s, i) => (
        <div
          key={s}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background:
              active === s
                ? "rgba(0, 200, 120, 0.12)"
                : "var(--surface)",
            opacity:
              activeIndex === -1
                ? 0.45
                : activeIndex >= i
                ? 1
                : 0.45,
          }}
        >
          <strong style={{ textTransform: "capitalize" }}>{s}</strong>
          <div style={{ fontSize: 13, color: "var(--text-2)" }}>
            {stepDescription(s)}
          </div>
        </div>
      ))}
    </div>
  );
}

function stepDescription(step: Step) {
  switch (step) {
    case "received":
      return "Webhook receives request";
    case "validated":
      return "Spam & schema checks";
    case "stored":
      return "Persisted in Supabase";
    case "classified":
      return "AI intent & urgency tagging";
    case "notified":
      return "Routed & alerted";
    default:
      return "";
  }
}

function getAllCountries(): Country[] {
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

  const ISO_CODES = [
    "AF","AL","DZ","AS","AD","AO","AI","AQ","AG","AR","AM","AW","AU","AT","AZ",
    "BS","BH","BD","BB","BY","BE","BZ","BJ","BM","BT","BO","BA","BW","BR","BN","BG",
    "BF","BI","KH","CM","CA","CV","KY","CF","TD","CL","CN","CO","KM","CG","CR","CI",
    "HR","CU","CY","CZ","DK","DJ","DM","DO","EC","EG","SV","EE","ET","FI","FR","GF",
    "GA","GM","GE","DE","GH","GI","GR","GL","GD","GP","GU","GT","GN","GY","HT","HN",
    "HK","HU","IS","IN","ID","IR","IQ","IE","IL","IT","JM","JP","JO","KZ","KE","KR",
    "KW","KG","LA","LV","LB","LS","LR","LY","LT","LU","MO","MG","MW","MY","MV","ML",
    "MT","MQ","MR","MU","MX","MD","MC","MN","ME","MA","MZ","MM","NA","NP","NL","NZ",
    "NI","NE","NG","NO","OM","PK","PA","PY","PE","PH","PL","PT","PR","QA","RO","RU",
    "SA","SN","RS","SG","SK","SI","ZA","ES","LK","SD","SR","SE","CH","SY","TW","TJ",
    "TZ","TH","TN","TR","UG","UA","AE","GB","US","UY","UZ","VE","VN","YE","ZM","ZW"
  ];

  return ISO_CODES
    .map((code) => ({
      code,
      name: regionNames.of(code),
    }))
    .filter((c): c is Country => Boolean(c.name))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function detectCountryName(countries: Country[]): string | null {
  // 1) Timezone-based (best offline signal)
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (typeof tz === "string") {
      if (tz.startsWith("Australia/")) {
        return countries.find((c) => c.code === "AU")?.name ?? "Australia";
      }
      if (tz.startsWith("Pacific/Auckland")) {
        return countries.find((c) => c.code === "NZ")?.name ?? "New Zealand";
      }
      // Add more mappings only if you care later
    }
  } catch {
    // ignore
  }

  // 2) Locale fallback (may be wrong if user language is different)
  try {
    const locale = navigator.language || navigator.languages?.[0] || "";
    const m = locale.match(/[-_](\w{2})$/);
    if (m) {
      const regionCode = m[1].toUpperCase();
      const match = countries.find((c) => c.code === regionCode);
      if (match) return match.name;
    }
  } catch {
    // ignore
  }

  return null;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 13, color: "var(--text-2)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
