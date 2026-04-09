"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SubmitStatus =
    | { type: "idle" }
    | { type: "loading" }
    | { type: "success"; message: string }
    | { type: "error"; message: string };

type EmploymentType =
    | "full_time"
    | "part_time"
    | "self_employed"
    | "casual_contractor";

type BuyTimeline = "asap" | "1_3" | "3_6" | "6plus";

type PurchaseDetails = {
    propertyPrice: string;
    deposit: string;
    annualIncome: string;
    hasSecondApplicant: boolean | null;
    secondIncome: string;
    monthlyDebts: string;
    employmentType: EmploymentType | "";
    buyTimeline: BuyTimeline | "";
    listingUrl: string;
    fhbStatus: "yes" | "unsure" | null;
    ownsProperty: boolean | null;
    weeklyRent: string;
};

type AffordabilityBand = "achievable" | "close" | "difficult";

type PurchaseEstimate = {
    kind: "purchase";
    borrowingLow: number;
    borrowingHigh: number;
    repaymentMid: number;
    repaymentLow: number;
    repaymentHigh: number;
    propertyPrice: number;
    deposit: number;
    affordability: AffordabilityBand;
    bestCaseShortfall: number;
    teaserLine: string;
};

type FullPurchaseResult = {
    kind: "purchase";
    headline: string;
    strengths: string[];
    watchouts: string[];
    nextSteps: string[];
};

declare global {
    interface Window {
        turnstile?: {
            render: (
                element: HTMLElement,
                options: {
                    sitekey: string;
                    callback: (token: string) => void;
                    "expired-callback"?: () => void;
                    "error-callback"?: () => void;
                    theme?: "light" | "dark";
                }
            ) => string;
            remove?: (widgetId: string) => void;
        };
    }
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const PREVIEW_VERSION = "frontend_preview_v4";
const BROKER_NAME =
    process.env.NEXT_PUBLIC_MORTGAGE_BROKER_NAME || "the broker";

function sanitizePhone(phone: string): string {
    return phone.replace(/[^\d+ ]/g, "").replace(/\s+/g, " ").trim();
}

function normalizeNumericInput(input: string): string {
    const stripped = input.replace(/[^\d.]/g, "");
    const firstDot = stripped.indexOf(".");
    if (firstDot === -1) return stripped;
    return (
        stripped.slice(0, firstDot + 1) +
        stripped.slice(firstDot + 1).replace(/\./g, "")
    );
}

function parseMoney(input: string): number {
    const cleaned = normalizeNumericInput(input).trim();
    if (!cleaned) return 0;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(n: number, min: number, max: number) {
    return Math.min(Math.max(n, min), max);
}

function calcMonthlyPayment(
    principal: number,
    annualRateDecimal: number,
    years: number
): number {
    if (principal <= 0 || years <= 0) return 0;

    const monthlyRate = annualRateDecimal / 12;
    const totalMonths = years * 12;

    if (monthlyRate <= 0) return principal / totalMonths;

    const numerator =
        principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths);
    const denominator = Math.pow(1 + monthlyRate, totalMonths) - 1;

    if (!denominator) return 0;
    return numerator / denominator;
}

function employmentFactor(type: EmploymentType | ""): number {
    switch (type) {
        case "full_time":
            return 1;
        case "part_time":
            return 0.94;
        case "self_employed":
            return 0.9;
        case "casual_contractor":
            return 0.9;
        default:
            return 0.94;
    }
}

function computePurchaseEstimate(
    input: PurchaseDetails,
    goal: "buy_home" | "first_home" | "invest"
): PurchaseEstimate {
    const propertyPrice = parseMoney(input.propertyPrice);
    const deposit = parseMoney(input.deposit);
    const annualIncome = parseMoney(input.annualIncome);
    const secondIncome = input.hasSecondApplicant
        ? parseMoney(input.secondIncome)
        : 0;
    const monthlyDebts = parseMoney(input.monthlyDebts);
    const weeklyRent = parseMoney(input.weeklyRent);
    const rentBoostAnnual =
        goal === "invest" && weeklyRent > 0 ? weeklyRent * 52 * 0.75 : 0;

    const totalIncome = annualIncome + secondIncome + rentBoostAnnual;

    const empFactor =
        goal === "invest" ? 0.93 : employmentFactor(input.employmentType);
    const annualDebtPenalty = monthlyDebts * 12 * 6;

    const rawLow = totalIncome * 3.7 * empFactor - annualDebtPenalty;
    const rawHigh = totalIncome * 4.5 * empFactor - annualDebtPenalty;

    const borrowingLow = Math.max(0, rawLow);
    const borrowingHigh = Math.max(borrowingLow, rawHigh);

    const budgetLow = borrowingLow + deposit;
    const budgetHigh = borrowingHigh + deposit;

    const repaymentLow = calcMonthlyPayment(borrowingLow, 0.064, 30);
    const repaymentHigh = calcMonthlyPayment(borrowingHigh, 0.074, 30);
    const repaymentMid = (repaymentLow + repaymentHigh) / 2;

    let affordability: AffordabilityBand = "difficult";
    if (propertyPrice > 0 && budgetLow >= propertyPrice) affordability = "achievable";
    else if (propertyPrice > 0 && budgetHigh >= propertyPrice) affordability = "close";

    const bestCaseShortfall =
        propertyPrice > 0 ? Math.max(propertyPrice - budgetHigh, 0) : 0;

    let teaserLine =
        "You may be close, but your deposit, debts, and overall setup could still affect the outcome.";
    if (affordability === "achievable") {
        teaserLine =
            "At first glance, this property may be within reach — but things like deposit, debts, and lender rules still matter.";
    } else if (affordability === "close") {
        teaserLine =
            "You may be close, but your deposit and existing debts could affect lender confidence.";
    } else {
        teaserLine =
            "At this price, things may be a bit tight right now — but a bigger deposit, less debt, or a lower price point could help.";
    }

    return {
        kind: "purchase",
        borrowingLow,
        borrowingHigh,
        repaymentMid,
        repaymentLow,
        repaymentHigh,
        propertyPrice,
        deposit,
        affordability,
        bestCaseShortfall,
        teaserLine,
    };
}

function buildFullPurchaseResult(
    goal: "buy_home" | "first_home" | "invest",
    input: PurchaseDetails,
    est: PurchaseEstimate
): FullPurchaseResult {
    const deposit = est.deposit;
    const price = est.propertyPrice;
    const depositPct = price > 0 ? (deposit / price) * 100 : 0;
    const totalInc =
        parseMoney(input.annualIncome) +
        (input.hasSecondApplicant ? parseMoney(input.secondIncome) : 0);

    const strengths: string[] = [];
    const watchouts: string[] = [];
    const nextSteps: string[] = [];

    if (totalInc >= 80000) {
        strengths.push("Strong household income relative to many scenarios.");
    }
    if (depositPct >= 15 && price > 0) {
        strengths.push("Good deposit relative to the price entered.");
    }
    if (parseMoney(input.monthlyDebts) < totalInc / 12 / 8) {
        strengths.push("Existing debts appear manageable at a headline level.");
    }
    if (input.buyTimeline === "asap" || input.buyTimeline === "1_3") {
        strengths.push("Buying timeline looks clear, which helps with next steps.");
    }
    if (!strengths.length) {
        strengths.push("You’ve provided enough detail for a useful first-pass view.");
    }

    if (depositPct > 0 && depositPct < 10 && price > 0) {
        watchouts.push("Deposit may be slightly thin for this price point.");
    }
    if (parseMoney(input.monthlyDebts) > 0) {
        watchouts.push("Existing debt commitments may reduce borrowing power.");
    }
    if (
        goal !== "invest" &&
        (input.employmentType === "self_employed" ||
            input.employmentType === "casual_contractor")
    ) {
        watchouts.push("Self-employed or non-PAYG income may require more lender assessment.");
    }
    if (est.affordability === "close" || est.affordability === "difficult") {
        watchouts.push("Rate sensitivity may affect affordability at the upper end of your range.");
    }

    nextSteps.push("Increase deposit to improve borrowing comfort where possible.");
    nextSteps.push("Reduce existing debt to strengthen serviceability if you can.");
    if (est.affordability === "difficult") {
        nextSteps.push("Review price range slightly lower for stronger approval odds.");
    }
    nextSteps.push(`Speak to ${BROKER_NAME} to identify lenders likely to suit your scenario.`);

    let headline = "You may be close, but there are a few issues to improve";
    if (est.affordability === "achievable") {
        headline = "This property looks realistically within reach";
    } else if (est.affordability === "difficult") {
        headline = "This purchase may be difficult right now without changes";
    }

    return {
        kind: "purchase",
        headline,
        strengths: strengths.slice(0, 5),
        watchouts: watchouts.slice(0, 5),
        nextSteps: nextSteps.slice(0, 5),
    };
}

function TurnstileWidget({
    siteKey,
    onToken,
    onExpired,
}: {
    siteKey: string;
    onToken: (token: string) => void;
    onExpired: () => void;
}) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!siteKey || !containerRef.current) return;

        let cancelled = false;

        const cleanup = () => {
            if (widgetIdRef.current && window.turnstile?.remove) {
                window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }
        };

        const renderWidget = () => {
            if (cancelled || !containerRef.current || !window.turnstile) return;
            cleanup();
            containerRef.current.innerHTML = "";
            widgetIdRef.current = window.turnstile.render(containerRef.current, {
                sitekey: siteKey,
                callback: (token: string) => onToken(token),
                "expired-callback": onExpired,
                "error-callback": onExpired,
                theme: "light",
            });
        };

        if (window.turnstile) {
            renderWidget();
            return () => {
                cancelled = true;
                cleanup();
            };
        }

        const existing = document.querySelector<HTMLScriptElement>(
            'script[src*="challenges.cloudflare.com/turnstile"]'
        );

        if (existing) {
            existing.addEventListener("load", renderWidget, { once: true });
            return () => {
                cancelled = true;
                cleanup();
            };
        }

        const script = document.createElement("script");
        script.src =
            "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.onload = renderWidget;
        document.head.appendChild(script);

        return () => {
            cancelled = true;
            cleanup();
        };
    }, [siteKey, onExpired, onToken]);

    if (!siteKey) return null;

    return <div ref={containerRef} />;
}

export default function MortgageBrokerDemoTestPage() {
    const [status, setStatus] = useState<SubmitStatus>({ type: "idle" });
    const [turnstileToken, setTurnstileToken] = useState("");

    const handleTurnstileToken = useCallback((token: string) => {
        setTurnstileToken(token);
        setStatus((prev) => (prev.type === "error" ? { type: "idle" } : prev));
    }, []);

    const handleTurnstileExpired = useCallback(() => {
        setTurnstileToken("");
    }, []);

    async function sendFakeLead() {
        if (status.type === "loading") return;

        if (TURNSTILE_SITE_KEY && !turnstileToken) {
            setStatus({
                type: "error",
                message: "Please complete the security check first.",
            });
            return;
        }

        setStatus({ type: "loading" });

        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 15000);

        try {
            const fakePurchase: PurchaseDetails = {
                propertyPrice: "980000",
                deposit: "190000",
                annualIncome: "145000",
                hasSecondApplicant: true,
                secondIncome: "85000",
                monthlyDebts: "950",
                employmentType: "full_time",
                buyTimeline: "1_3",
                listingUrl:
                    "https://www.realestate.com.au/property-house-nsw-baulkham+hills-123456789",
                fhbStatus: null,
                ownsProperty: null,
                weeklyRent: "",
            };

            const previewEstimate = computePurchaseEstimate(fakePurchase, "buy_home");
            const fullResult = buildFullPurchaseResult(
                "buy_home",
                fakePurchase,
                previewEstimate
            );

            const payload = {
                source: "website",
                formType: "mortgage_lead_magnet",
                previewVersion: PREVIEW_VERSION,
                goal: "buy_home" as const,
                honeypot: "",
                consentAccepted: true,
                rawInputs: {
                    propertyPrice: String(parseMoney(fakePurchase.propertyPrice)),
                    deposit: String(parseMoney(fakePurchase.deposit)),
                    annualIncome: String(parseMoney(fakePurchase.annualIncome)),
                    hasSecondApplicant: fakePurchase.hasSecondApplicant === true,
                    secondIncome: String(
                        fakePurchase.hasSecondApplicant
                            ? parseMoney(fakePurchase.secondIncome)
                            : 0
                    ),
                    monthlyDebts: String(parseMoney(fakePurchase.monthlyDebts)),
                    buyTimeline: fakePurchase.buyTimeline,
                    listingUrl: fakePurchase.listingUrl.trim(),
                    employmentType: fakePurchase.employmentType,
                },
                lead: {
                    fullName: "Test Prospect",
                    email: "akshaygovil913@gmail.com",
                    phone: sanitizePhone("0410 023 610"),
                },
                metadata: {
                    pagePath: "/mortgage-broker-demo",
                    userAgent:
                        typeof navigator !== "undefined" ? navigator.userAgent : "",
                    submittedAtClient: new Date().toISOString(),
                    turnstileToken: turnstileToken || null,
                },
                previewEstimate,
                fullResult,
            };

            const res = await fetch("/api/mortgage-broker-demo", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                signal: controller.signal,
                body: JSON.stringify(payload),
            });

            const rawText = await res.text();

            let maybeJson: Record<string, unknown> | null = null;
            try {
                maybeJson = rawText
                    ? (JSON.parse(rawText) as Record<string, unknown>)
                    : null;
            } catch {
                maybeJson = null;
            }

            if (!res.ok) {
                const msg =
                    typeof maybeJson?.message === "string"
                        ? maybeJson.message
                        : typeof maybeJson?.error === "string"
                            ? maybeJson.error
                            : rawText || `Request failed with status ${res.status}`;

                throw new Error(msg);
            }

            setStatus({
                type: "success",
                message: "Fake lead submitted successfully.",
            });
        } catch (error) {
            setStatus({
                type: "error",
                message:
                    error instanceof Error
                        ? error.message
                        : "Something went wrong while submitting the fake lead.",
            });
        } finally {
            clearTimeout(timeout);
        }
    }

    return (
        <main
            style={{
                minHeight: "100vh",
                display: "grid",
                placeItems: "center",
                padding: "24px",
                background: "#f7f7f8",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 560,
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    padding: 24,
                    boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
                }}
            >
                <h1
                    style={{
                        margin: 0,
                        fontSize: 28,
                        lineHeight: 1.2,
                        fontWeight: 700,
                    }}
                >
                    Mortgage lead magnet test
                </h1>

                <p
                    style={{
                        marginTop: 12,
                        marginBottom: 20,
                        color: "#4b5563",
                        lineHeight: 1.6,
                    }}
                >
                    This sends a fake submission to the exact same API route and
                    generates previewEstimate and fullResult using the same logic
                    as the real lead magnet.
                </p>

                {TURNSTILE_SITE_KEY ? (
                    <div style={{ marginBottom: 16 }}>
                        <TurnstileWidget
                            siteKey={TURNSTILE_SITE_KEY}
                            onToken={handleTurnstileToken}
                            onExpired={handleTurnstileExpired}
                        />
                    </div>
                ) : null}

                <button
                    type="button"
                    onClick={sendFakeLead}
                    disabled={
                        status.type === "loading" ||
                        (Boolean(TURNSTILE_SITE_KEY) && !turnstileToken)
                    }
                    style={{
                        width: "100%",
                        border: "none",
                        borderRadius: 12,
                        padding: "14px 18px",
                        fontSize: 16,
                        fontWeight: 600,
                        cursor:
                            status.type === "loading" ||
                                (Boolean(TURNSTILE_SITE_KEY) && !turnstileToken)
                                ? "not-allowed"
                                : "pointer",
                        opacity:
                            status.type === "loading" ||
                                (Boolean(TURNSTILE_SITE_KEY) && !turnstileToken)
                                ? 0.7
                                : 1,
                        background: "#111827",
                        color: "#ffffff",
                    }}
                >
                    {status.type === "loading"
                        ? "Sending fake lead..."
                        : "Send fake lead"}
                </button>

                {status.type === "success" ? (
                    <div
                        style={{
                            marginTop: 16,
                            padding: 14,
                            borderRadius: 12,
                            background: "#ecfdf5",
                            color: "#065f46",
                            border: "1px solid #a7f3d0",
                        }}
                    >
                        {status.message}
                    </div>
                ) : null}

                {status.type === "error" ? (
                    <div
                        style={{
                            marginTop: 16,
                            padding: 14,
                            borderRadius: 12,
                            background: "#fef2f2",
                            color: "#991b1b",
                            border: "1px solid #fecaca",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                        }}
                    >
                        {status.message}
                    </div>
                ) : null}
            </div>
        </main>
    );
}