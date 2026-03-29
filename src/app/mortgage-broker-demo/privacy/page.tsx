import type { Metadata } from "next";

const COMPANY_NAME = "Your Agency Name";
const LEGAL_NAME = "Your Legal Entity Pty Ltd";
const WEBSITE_URL = "https://yourdomain.com";
const SUPPORT_EMAIL = "hello@yourdomain.com";
const BUSINESS_ADDRESS = "Sydney, NSW, Australia";
const EFFECTIVE_DATE = "26 March 2026";

export const metadata: Metadata = {
    title: `Privacy Policy | ${COMPANY_NAME}`,
    description: `Privacy Policy for ${COMPANY_NAME}`,
    alternates: {
        canonical: `${WEBSITE_URL}/privacy-policy`,
    },
};

const sectionStyle: React.CSSProperties = {
    marginTop: 32,
};

const h2Style: React.CSSProperties = {
    fontSize: "1.4rem",
    marginBottom: 12,
};

const pStyle: React.CSSProperties = {
    lineHeight: 1.7,
    marginBottom: 14,
    color: "#d1d5db",
};

const liStyle: React.CSSProperties = {
    lineHeight: 1.7,
    marginBottom: 8,
    color: "#d1d5db",
};

export default function PrivacyPolicyPage() {
    return (
        <main
            style={{
                minHeight: "100vh",
                background: "#0b0f19",
                color: "#ffffff",
                padding: "64px 20px",
            }}
        >
            <div
                style={{
                    maxWidth: 820,
                    margin: "0 auto",
                }}
            >
                <p
                    style={{
                        fontSize: 12,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "#93c5fd",
                        marginBottom: 12,
                    }}
                >
                    Legal
                </p>

                <h1
                    style={{
                        fontSize: "clamp(2rem, 5vw, 3.5rem)",
                        lineHeight: 1.05,
                        marginBottom: 16,
                    }}
                >
                    Privacy Policy
                </h1>

                <p
                    style={{
                        ...pStyle,
                        fontSize: "1.05rem",
                        color: "#cbd5e1",
                    }}
                >
                    This Privacy Policy explains how {LEGAL_NAME} trading as {COMPANY_NAME} collects,
                    uses, stores, and shares information when you use our website, services,
                    automations, software, and AI systems.
                </p>

                <p style={pStyle}>
                    <strong>Effective date:</strong> {EFFECTIVE_DATE}
                    <br />
                    <strong>Website:</strong> {WEBSITE_URL}
                    <br />
                    <strong>Contact:</strong>{" "}
                    <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "#bfdbfe" }}>
                        {SUPPORT_EMAIL}
                    </a>
                </p>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>1. Information We Collect</h2>
                    <p style={pStyle}>We may collect:</p>
                    <ul style={{ paddingLeft: 20 }}>
                        <li style={liStyle}>name, email address, phone number, and business details;</li>
                        <li style={liStyle}>account, login, and authentication information;</li>
                        <li style={liStyle}>messages, form submissions, uploaded files, and user content;</li>
                        <li style={liStyle}>technical usage data such as IP address, browser, device, and site activity;</li>
                        <li style={liStyle}>billing and transaction-related information where applicable.</li>
                    </ul>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>2. How We Use Information</h2>
                    <ul style={{ paddingLeft: 20 }}>
                        <li style={liStyle}>to provide and improve our services;</li>
                        <li style={liStyle}>to communicate with you about projects, support, and updates;</li>
                        <li style={liStyle}>to operate software, automations, AI workflows, and integrations;</li>
                        <li style={liStyle}>to maintain security, prevent misuse, and detect issues;</li>
                        <li style={liStyle}>to comply with legal obligations and enforce our terms.</li>
                    </ul>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>3. Google Account and Google API Data</h2>
                    <p style={pStyle}>
                        If you connect your Google account or authorize access to Google services, we may
                        access Google user data only as needed to provide the features you request.
                    </p>
                    <p style={pStyle}>Depending on the integration, this may include:</p>
                    <ul style={{ paddingLeft: 20 }}>
                        <li style={liStyle}>basic profile information;</li>
                        <li style={liStyle}>email or Gmail-related data;</li>
                        <li style={liStyle}>Google Calendar data;</li>
                        <li style={liStyle}>Google Contacts data;</li>
                        <li style={liStyle}>Google Drive or related Workspace data you authorize.</li>
                    </ul>
                    <p style={pStyle}>
                        We use this data only to authenticate you, provide the requested integration,
                        operate the service, and support or secure the system.
                    </p>
                    <p style={pStyle}>
                        We do not sell Google user data. We do not use Google Workspace API data to
                        develop, improve, or train generalized AI or machine learning models.
                    </p>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>4. AI and Automated Processing</h2>
                    <p style={pStyle}>
                        Our services may use artificial intelligence, automation, and language models to
                        classify information, generate drafts, summarize content, route requests, and
                        assist with workflows.
                    </p>
                    <p style={pStyle}>
                        AI-generated outputs may be incomplete or inaccurate, and users are responsible
                        for reviewing outputs before relying on them.
                    </p>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>5. Sharing of Information</h2>
                    <p style={pStyle}>We may share information with:</p>
                    <ul style={{ paddingLeft: 20 }}>
                        <li style={liStyle}>service providers and subprocessors that help operate our services;</li>
                        <li style={liStyle}>professional advisers such as lawyers, accountants, or insurers;</li>
                        <li style={liStyle}>regulators, authorities, or courts where required by law;</li>
                        <li style={liStyle}>other parties where you direct us to share information.</li>
                    </ul>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>6. Data Retention</h2>
                    <p style={pStyle}>
                        We retain information only for as long as reasonably necessary to provide our
                        services, comply with legal obligations, resolve disputes, and enforce agreements.
                    </p>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>7. Security</h2>
                    <p style={pStyle}>
                        We use reasonable technical and organisational measures to protect personal
                        information. However, no system can be guaranteed to be completely secure.
                    </p>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>8. Your Rights</h2>
                    <p style={pStyle}>
                        Depending on applicable law, you may have rights to access, correct, delete, or
                        restrict certain personal information. To make a request, contact us at{" "}
                        <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "#bfdbfe" }}>
                            {SUPPORT_EMAIL}
                        </a>
                        .
                    </p>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>9. Third-Party Services</h2>
                    <p style={pStyle}>
                        Our website and services may interact with third-party tools, platforms, and APIs.
                        Those third parties operate under their own terms and privacy policies.
                    </p>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>10. Changes to This Policy</h2>
                    <p style={pStyle}>
                        We may update this Privacy Policy from time to time. The updated version will be
                        posted on this page with a revised effective date.
                    </p>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>11. Contact Us</h2>
                    <p style={pStyle}>
                        {LEGAL_NAME}
                        <br />
                        {BUSINESS_ADDRESS}
                        <br />
                        <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "#bfdbfe" }}>
                            {SUPPORT_EMAIL}
                        </a>
                        <br />
                        <a href={WEBSITE_URL} style={{ color: "#bfdbfe" }}>
                            {WEBSITE_URL}
                        </a>
                    </p>
                </section>
            </div>
        </main>
    );
}