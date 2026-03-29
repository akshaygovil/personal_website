import type { Metadata } from "next";

const COMPANY_NAME = "Your Agency Name";
const LEGAL_NAME = "Your Legal Entity Pty Ltd";
const WEBSITE_URL = "https://yourdomain.com";
const SUPPORT_EMAIL = "hello@yourdomain.com";
const BUSINESS_ADDRESS = "Sydney, NSW, Australia";
const EFFECTIVE_DATE = "26 March 2026";
const GOVERNING_LAW = "New South Wales, Australia";

export const metadata: Metadata = {
    title: `Terms of Service | ${COMPANY_NAME}`,
    description: `Terms of Service for ${COMPANY_NAME}`,
    alternates: {
        canonical: `${WEBSITE_URL}/terms-of-service`,
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

export default function TermsOfServicePage() {
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
                    Terms of Service
                </h1>

                <p
                    style={{
                        ...pStyle,
                        fontSize: "1.05rem",
                        color: "#cbd5e1",
                    }}
                >
                    These Terms of Service govern your access to and use of the website,
                    software, automations, deliverables, and AI-related services provided by{" "}
                    {LEGAL_NAME}.
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
                    <h2 style={h2Style}>1. Acceptance of Terms</h2>
                    <p style={pStyle}>
                        By accessing or using our website or services, you agree to these Terms of
                        Service and our Privacy Policy. If you do not agree, you must not use our
                        website or services.
                    </p>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>2. Services</h2>
                    <p style={pStyle}>
                        {COMPANY_NAME} provides AI-related and software-related services, including
                        consulting, implementation, automations, integrations, custom development,
                        support, and related deliverables.
                    </p>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>3. Eligibility</h2>
                    <p style={pStyle}>
                        You represent that you are at least 18 years old and have the legal capacity
                        to enter into these Terms. If you use the services on behalf of an entity, you
                        represent that you have authority to bind that entity.
                    </p>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>4. Accounts and Access</h2>
                    <p style={pStyle}>
                        You may need to provide credentials, account access, permissions, content, or
                        technical information for us to provide services. You are responsible for the
                        accuracy of information you provide and for maintaining the confidentiality of
                        your credentials.
                    </p>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>5. Client Data</h2>
                    <p style={pStyle}>
                        You are responsible for ensuring that you have all rights, permissions, and
                        lawful bases required for us to process data, files, prompts, messages,
                        contacts, and other materials you provide or authorize us to access.
                    </p>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>6. AI Outputs</h2>
                    <p style={pStyle}>
                        Our services may generate outputs using AI or automated systems. Those outputs
                        may be incomplete, inaccurate, or unsuitable for your intended purpose.
                    </p>
                    <p style={pStyle}>
                        You are responsible for reviewing, testing, and validating outputs before using
                        them in business, legal, financial, medical, compliance, or other important
                        contexts.
                    </p>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>7. Acceptable Use</h2>
                    <p style={pStyle}>You must not use our services to:</p>
                    <ul style={{ paddingLeft: 20 }}>
                        <li style={liStyle}>break any law or regulation;</li>
                        <li style={liStyle}>infringe privacy, confidentiality, or intellectual property rights;</li>
                        <li style={liStyle}>transmit malicious code, spam, or abusive content;</li>
                        <li style={liStyle}>attempt unauthorized access to systems or data;</li>
                        <li style={liStyle}>use the services for unlawful, harmful, or deceptive conduct.</li>
                    </ul>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>8. Fees and Payment</h2>
                    <p style={pStyle}>
                        Fees, billing terms, and payment timing will be governed by any proposal,
                        invoice, order form, statement of work, or other written agreement between the
                        parties.
                    </p>
                    <p style={pStyle}>
                        Unless otherwise agreed in writing, fees are non-refundable once work has
                        commenced or services have been delivered.
                    </p>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>9. Intellectual Property</h2>
                    <p style={pStyle}>
                        We retain all rights in our pre-existing materials, tools, systems, methods,
                        templates, code libraries, branding, and know-how.
                    </p>
                    <p style={pStyle}>
                        Unless otherwise agreed in writing, you receive a limited, non-exclusive,
                        non-transferable right to use deliverables we provide to you for your internal
                        business purposes.
                    </p>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>10. Confidentiality</h2>
                    <p style={pStyle}>
                        Each party must use the other party’s confidential information only for the
                        purpose of providing or receiving services and must protect it with reasonable
                        care.
                    </p>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>11. Third-Party Services</h2>
                    <p style={pStyle}>
                        Our services may rely on third-party tools, APIs, model providers, cloud
                        providers, communication platforms, and other external services. We are not
                        responsible for the performance, availability, or policies of those third
                        parties.
                    </p>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>12. Disclaimers</h2>
                    <p style={pStyle}>
                        To the maximum extent permitted by law, the website and services are provided on
                        an “as is” and “as available” basis without warranties of any kind, except as
                        required by applicable law.
                    </p>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>13. Limitation of Liability</h2>
                    <p style={pStyle}>
                        To the fullest extent permitted by law, we are not liable for indirect,
                        incidental, special, consequential, or punitive damages, or for loss of
                        profits, revenue, data, goodwill, or business opportunity.
                    </p>
                    <p style={pStyle}>
                        To the fullest extent permitted by law, our total liability arising out of or
                        relating to the services will not exceed the amount paid by you to us for the
                        specific services giving rise to the claim in the 3 months before the event, or
                        AUD $100 if no amount was paid.
                    </p>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>14. Termination</h2>
                    <p style={pStyle}>
                        We may suspend or terminate access to the services if you breach these Terms,
                        fail to pay fees when due, create risk, or where continued provision of the
                        services is not legally or commercially feasible.
                    </p>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>15. Governing Law</h2>
                    <p style={pStyle}>
                        These Terms are governed by the laws of {GOVERNING_LAW}. Any dispute arising
                        out of or relating to these Terms or the services will be subject to the courts
                        of {GOVERNING_LAW}, unless applicable law requires otherwise.
                    </p>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>16. Changes to These Terms</h2>
                    <p style={pStyle}>
                        We may update these Terms from time to time. The updated version will be posted
                        on this page with a revised effective date.
                    </p>
                </section>

                <section style={sectionStyle}>
                    <h2 style={h2Style}>17. Contact Us</h2>
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