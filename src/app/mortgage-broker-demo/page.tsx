"use client";

import {
    CSSProperties,
    FormEvent,
    ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

type Goal = "buy" | "invest" | "refinance";

type EmploymentType =
    | "full_time"
    | "part_time"
    | "casual"
    | "self_employed"
    | "contractor";

type PurchaseDetails = {
    isFirstHomeBuyer: boolean | null;
    propertyPrice: string;
    deposit: string;
    annualIncome: string;
    secondIncome: string;
    monthlyDebts: string;
    postcode: string;
    employmentType: EmploymentType | "";
    listingUrl: string;
};

type RefinanceDetails = {
    loanBalance: string;
    interestRate: string;
    loanTermYears: string;
    propertyValue: string;
    currentRepayment: string;
    postcode: string;
};

type LeadDetails = {
    fullName: string;
    email: string;
    phone: string;
};

type SubmitStatus =
    | { type: "idle" }
    | { type: "loading" }
    | { type: "success" }
    | { type: "error"; message: string };

type FieldErrors = Record<string, string>;

type PurchaseEstimate = {
    kind: "purchase";
    borrowingLow: number;
    borrowingHigh: number;
    budgetLow: number;
    budgetHigh: number;
    repaymentLow: number;
    repaymentHigh: number;
    propertyPrice: number;
    deposit: number;
    position: "within" | "close" | "short";
    bestCaseShortfall: number;
    bestCaseBuffer: number;
    insightLines: string[];
};

type RefinanceEstimate = {
    kind: "refinance";
    currentRepaymentEstimate: number;
    improvedRepaymentLow: number;
    improvedRepaymentHigh: number;
    savingsLow: number;
    savingsHigh: number;
    lvr: number | null;
    position: "strong" | "possible" | "review";
    insightLines: string[];
};

type PreviewEstimate = PurchaseEstimate | RefinanceEstimate | null;

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
        posthog?: {
            capture?: (event: string, properties?: Record<string, unknown>) => void;
        };
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

const STORAGE_KEY = "mortgage-lead-ui-v3";
const PREVIEW_VERSION = "frontend_preview_v3";
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

const DEFAULT_PURCHASE: PurchaseDetails = {
    isFirstHomeBuyer: null,
    propertyPrice: "",
    deposit: "",
    annualIncome: "",
    secondIncome: "",
    monthlyDebts: "",
    postcode: "",
    employmentType: "",
    listingUrl: "",
};

const DEFAULT_REFI: RefinanceDetails = {
    loanBalance: "",
    interestRate: "",
    loanTermYears: "",
    propertyValue: "",
    currentRepayment: "",
    postcode: "",
};

const DEFAULT_LEAD: LeadDetails = {
    fullName: "",
    email: "",
    phone: "",
};

function clamp(n: number, min: number, max: number) {
    return Math.min(Math.max(n, min), max);
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

function parseDigits(input: string): string {
    return input.replace(/\D/g, "");
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

function fmtAUD(value: number): string {
    return new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
        maximumFractionDigits: 0,
    }).format(Math.max(0, value));
}

function fmtRange(low: number, high: number): string {
    return `${fmtAUD(low)} – ${fmtAUD(high)}`;
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPostcode(postcode: string): boolean {
    return /^\d{4}$/.test(postcode.trim());
}

function isValidUrl(value: string): boolean {
    if (!value.trim()) return true;
    try {
        const u = new URL(value.trim());
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

function sanitizePhone(phone: string): string {
    return phone.replace(/[^\d+ ]/g, "").replace(/\s+/g, " ").trim();
}

function isValidPhone(phone: string): boolean {
    const digits = parseDigits(phone);
    return digits.length >= 8 && digits.length <= 15;
}

function track(event: string, props?: Record<string, unknown>) {
    if (typeof window === "undefined") return;
    window.gtag?.("event", event, props || {});
    window.posthog?.capture?.(event, props || {});
}

function employmentFactor(type: EmploymentType | ""): number {
    switch (type) {
        case "full_time":
            return 1;
        case "part_time":
            return 0.94;
        case "contractor":
            return 0.92;
        case "self_employed":
            return 0.9;
        case "casual":
            return 0.88;
        default:
            return 0.94;
    }
}

function computePurchaseEstimate(input: PurchaseDetails): PurchaseEstimate {
    const propertyPrice = parseMoney(input.propertyPrice);
    const deposit = parseMoney(input.deposit);
    const annualIncome = parseMoney(input.annualIncome);
    const secondIncome = parseMoney(input.secondIncome);
    const monthlyDebts = parseMoney(input.monthlyDebts);
    const totalIncome = annualIncome + secondIncome;

    const empFactor = employmentFactor(input.employmentType);
    const annualDebtPenalty = monthlyDebts * 12 * 6;

    const rawLow = totalIncome * 3.7 * empFactor - annualDebtPenalty;
    const rawHigh = totalIncome * 4.5 * empFactor - annualDebtPenalty;

    const borrowingLow = Math.max(0, rawLow);
    const borrowingHigh = Math.max(borrowingLow, rawHigh);

    const budgetLow = borrowingLow + deposit;
    const budgetHigh = borrowingHigh + deposit;

    const repaymentLow = calcMonthlyPayment(borrowingLow, 0.064, 30);
    const repaymentHigh = calcMonthlyPayment(borrowingHigh, 0.074, 30);

    let position: "within" | "close" | "short" = "short";
    if (propertyPrice > 0 && budgetLow >= propertyPrice) position = "within";
    else if (propertyPrice > 0 && budgetHigh >= propertyPrice) position = "close";

    const bestCaseShortfall =
        propertyPrice > 0 ? Math.max(propertyPrice - budgetHigh, 0) : 0;
    const bestCaseBuffer =
        propertyPrice > 0 ? Math.max(budgetLow - propertyPrice, 0) : 0;

    const insightLines: string[] = [];

    if (deposit > 0 && propertyPrice > 0) {
        const depositPct = (deposit / propertyPrice) * 100;
        if (depositPct < 10) {
            insightLines.push(
                "Your deposit looks on the lighter side, so lender choice may be narrower."
            );
        } else if (depositPct >= 20) {
            insightLines.push(
                "A stronger deposit usually improves flexibility and can reduce upfront pressure."
            );
        } else {
            insightLines.push(
                "Your deposit is a workable starting point, though structure will matter."
            );
        }
    }

    if (monthlyDebts > 0) {
        insightLines.push(
            "Existing monthly debts may reduce your range, so cleaning up liabilities can help."
        );
    }

    if (input.isFirstHomeBuyer === true) {
        insightLines.push(
            "First-home-buyer support or stamp duty concessions may improve your overall position."
        );
    }

    if (!insightLines.length) {
        insightLines.push(
            "A broker can often improve the structure even when the headline range looks tight."
        );
    }

    return {
        kind: "purchase",
        borrowingLow,
        borrowingHigh,
        budgetLow,
        budgetHigh,
        repaymentLow,
        repaymentHigh,
        propertyPrice,
        deposit,
        position,
        bestCaseShortfall,
        bestCaseBuffer,
        insightLines: insightLines.slice(0, 3),
    };
}

function computeRefinanceEstimate(input: RefinanceDetails): RefinanceEstimate {
    const loanBalance = parseMoney(input.loanBalance);
    const rate = parseMoney(input.interestRate);
    const loanTermYears = clamp(
        Math.round(parseMoney(input.loanTermYears) || 25),
        1,
        40
    );
    const propertyValue = parseMoney(input.propertyValue);
    const currentRepaymentInput = parseMoney(input.currentRepayment);

    const currentRepaymentEstimate =
        currentRepaymentInput > 0
            ? currentRepaymentInput
            : calcMonthlyPayment(
                loanBalance,
                Math.max(rate, 0.1) / 100,
                loanTermYears
            );

    const improvedRateLow = Math.max(rate - 1.0, 4.99) / 100;
    const improvedRateHigh = Math.max(rate - 0.4, 5.49) / 100;

    const improvedRepaymentLow = calcMonthlyPayment(
        loanBalance,
        improvedRateLow,
        loanTermYears
    );
    const improvedRepaymentHigh = calcMonthlyPayment(
        loanBalance,
        improvedRateHigh,
        loanTermYears
    );

    const savingsLow = Math.max(currentRepaymentEstimate - improvedRepaymentHigh, 0);
    const savingsHigh = Math.max(currentRepaymentEstimate - improvedRepaymentLow, 0);

    const lvr = propertyValue > 0 ? (loanBalance / propertyValue) * 100 : null;

    let position: "strong" | "possible" | "review" = "review";
    if (savingsHigh >= 250) position = "strong";
    else if (savingsHigh >= 80) position = "possible";

    const insightLines: string[] = [];

    if (savingsHigh >= 250) {
        insightLines.push(
            "Your current setup looks worth reviewing because the rate gap may be meaningful."
        );
    } else if (savingsHigh > 0) {
        insightLines.push(
            "There may be room to improve your repayments, depending on product fit and fees."
        );
    } else {
        insightLines.push(
            "A deeper refinance review may still help if your goal is features, flexibility or structure."
        );
    }

    if (lvr !== null) {
        if (lvr <= 80) {
            insightLines.push("Your loan-to-value position looks relatively healthy.");
        } else {
            insightLines.push(
                "Your equity position may affect the lender options available."
            );
        }
    }

    if (!currentRepaymentInput) {
        insightLines.push(
            "Your current repayment was estimated for preview purposes because no live repayment was entered."
        );
    }

    return {
        kind: "refinance",
        currentRepaymentEstimate,
        improvedRepaymentLow,
        improvedRepaymentHigh,
        savingsLow,
        savingsHigh,
        lvr,
        position,
        insightLines: insightLines.slice(0, 3),
    };
}

function validatePurchaseDetails(data: PurchaseDetails): FieldErrors {
    const nextErrors: FieldErrors = {};
    const propertyPrice = parseMoney(data.propertyPrice);
    const deposit = parseMoney(data.deposit);
    const annualIncome = parseMoney(data.annualIncome);
    const secondIncome = parseMoney(data.secondIncome);
    const monthlyDebts = parseMoney(data.monthlyDebts);

    if (data.isFirstHomeBuyer === null) {
        nextErrors.isFirstHomeBuyer = "Please choose yes or no.";
    }
    if (propertyPrice < 100000 || propertyPrice > 20000000) {
        nextErrors.propertyPrice = "Enter a realistic property price.";
    }
    if (deposit < 5000 || deposit > 10000000) {
        nextErrors.deposit = "Enter a realistic deposit amount.";
    }
    if (annualIncome < 20000 || annualIncome > 2000000) {
        nextErrors.annualIncome = "Enter a realistic annual income.";
    }
    if (data.secondIncome && (secondIncome < 0 || secondIncome > 2000000)) {
        nextErrors.secondIncome = "Enter a realistic second income.";
    }
    if (monthlyDebts < 0 || monthlyDebts > 50000) {
        nextErrors.monthlyDebts = "Enter a realistic monthly debt figure.";
    }
    if (!data.employmentType) {
        nextErrors.employmentType = "Choose your employment type.";
    }
    if (!isValidPostcode(data.postcode)) {
        nextErrors.postcode = "Enter a valid 4-digit postcode.";
    }
    if (!isValidUrl(data.listingUrl)) {
        nextErrors.listingUrl = "Enter a valid property link.";
    }

    return nextErrors;
}

function validateRefinanceDetails(data: RefinanceDetails): FieldErrors {
    const nextErrors: FieldErrors = {};
    const loanBalance = parseMoney(data.loanBalance);
    const interestRate = parseMoney(data.interestRate);
    const loanTermYears = parseMoney(data.loanTermYears);
    const propertyValue = parseMoney(data.propertyValue);
    const currentRepayment = parseMoney(data.currentRepayment);

    if (loanBalance < 10000 || loanBalance > 20000000) {
        nextErrors.loanBalance = "Enter a realistic loan balance.";
    }
    if (interestRate <= 0 || interestRate > 20) {
        nextErrors.interestRate = "Enter a realistic interest rate.";
    }
    if (loanTermYears < 1 || loanTermYears > 40) {
        nextErrors.loanTermYears = "Enter a realistic remaining term.";
    }
    if (propertyValue < 50000 || propertyValue > 25000000) {
        nextErrors.propertyValue = "Enter a realistic property value.";
    }
    if (data.currentRepayment && (currentRepayment <= 0 || currentRepayment > 50000)) {
        nextErrors.currentRepayment = "Enter a realistic monthly repayment.";
    }
    if (!isValidPostcode(data.postcode)) {
        nextErrors.postcode = "Enter a valid 4-digit postcode.";
    }

    return nextErrors;
}

function canRestoreToStep(goal: Goal | null, purchase: PurchaseDetails, refi: RefinanceDetails) {
    if (!goal) return 1;
    if (goal === "buy" || goal === "invest") {
        return Object.keys(validatePurchaseDetails(purchase)).length === 0 ? 3 : 2;
    }
    return Object.keys(validateRefinanceDetails(refi)).length === 0 ? 3 : 2;
}

function ProgressBar({ step, total }: { step: number; total: number }) {
    return (
        <div
            style={{
                display: "flex",
                gap: 6,
                marginBottom: 28,
                alignItems: "center",
            }}
            aria-hidden="true"
        >
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        flex: i === step - 1 ? "2 1 0" : "1 1 0",
                        height: 4,
                        borderRadius: 999,
                        background:
                            i < step
                                ? "var(--accent, #111827)"
                                : "var(--border, rgba(0,0,0,0.12))",
                        opacity: i < step - 1 ? 0.35 : 1,
                        transition: "all 180ms ease",
                    }}
                />
            ))}
            <span
                style={{
                    fontSize: 12,
                    color: "var(--text-muted, #6b7280)",
                    marginLeft: 8,
                    whiteSpace: "nowrap",
                    fontWeight: 600,
                }}
            >
                {step} / {total}
            </span>
        </div>
    );
}

function BackButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                border: "none",
                background: "transparent",
                padding: 0,
                marginBottom: 22,
                cursor: "pointer",
                color: "var(--text-muted, #6b7280)",
                fontSize: 13,
                fontWeight: 600,
            }}
        >
            ← Back
        </button>
    );
}

function TrustRow() {
    const items = [
        "Estimate in under 60 seconds",
        "No credit score impact",
        "Secure form",
    ];

    return (
        <div
            style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 14,
                justifyContent: "center",
                borderTop: "1px solid var(--border, rgba(0,0,0,0.1))",
                marginTop: 22,
                paddingTop: 18,
            }}
        >
            {items.map((item) => (
                <span
                    key={item}
                    style={{
                        fontSize: 12,
                        color: "var(--text-muted, #6b7280)",
                        fontWeight: 600,
                    }}
                >
                    {item}
                </span>
            ))}
        </div>
    );
}

function GoalButton({
    selected,
    icon,
    label,
    onClick,
}: {
    selected: boolean;
    icon: string;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                width: "100%",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 16px",
                borderRadius: 18,
                border: selected
                    ? "1px solid var(--accent, #111827)"
                    : "1px solid var(--border, rgba(0,0,0,0.12))",
                background: selected ? "rgba(0,0,0,0.03)" : "transparent",
                cursor: "pointer",
                transition: "all 150ms ease",
            }}
            aria-pressed={selected}
        >
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span
                style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text, #111827)",
                    flex: 1,
                }}
            >
                {label}
            </span>
            <span
                style={{
                    fontSize: 16,
                    fontWeight: 700,
                    opacity: selected ? 1 : 0,
                }}
            >
                ✓
            </span>
        </button>
    );
}

function StatCard({
    label,
    value,
    sub,
    emphasized = false,
}: {
    label: string;
    value: string;
    sub?: string;
    emphasized?: boolean;
}) {
    return (
        <div
            style={{
                border: "1px solid var(--border, rgba(0,0,0,0.12))",
                borderRadius: 20,
                padding: 18,
                background: "rgba(255,255,255,0.55)",
            }}
        >
            <div
                style={{
                    fontSize: 12,
                    color: "var(--text-muted, #6b7280)",
                    marginBottom: 8,
                    fontWeight: 600,
                }}
            >
                {label}
            </div>
            <div
                style={{
                    fontSize: emphasized ? 28 : 24,
                    lineHeight: 1.1,
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    color: "var(--text, #111827)",
                }}
            >
                {value}
            </div>
            {sub ? (
                <div
                    style={{
                        marginTop: 8,
                        fontSize: 12,
                        color: "var(--text-muted, #6b7280)",
                        lineHeight: 1.45,
                    }}
                >
                    {sub}
                </div>
            ) : null}
        </div>
    );
}

function Notice({
    tone,
    children,
}: {
    tone: "neutral" | "success" | "warning";
    children: ReactNode;
}) {
    const border =
        tone === "success"
            ? "rgba(16, 185, 129, 0.25)"
            : tone === "warning"
                ? "rgba(245, 158, 11, 0.25)"
                : "rgba(0,0,0,0.1)";

    return (
        <div
            style={{
                border: `1px solid ${border}`,
                borderRadius: 18,
                padding: 16,
                background: "rgba(255,255,255,0.6)",
                fontSize: 14,
                lineHeight: 1.55,
                color: "var(--text, #111827)",
            }}
        >
            {children}
        </div>
    );
}

function FieldError({
    id,
    children,
}: {
    id: string;
    children?: ReactNode;
}) {
    if (!children) return null;
    return (
        <div
            id={id}
            style={{
                marginTop: 8,
                fontSize: 12,
                color: "#b91c1c",
                fontWeight: 600,
            }}
        >
            {children}
        </div>
    );
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
    return <div ref={containerRef} style={{ marginTop: 14 }} />;
}

export default function MortgageLeadMagnetPage() {
    const topRef = useRef<HTMLDivElement>(null);
    const headingRef = useRef<HTMLHeadingElement>(null);

    const [step, setStep] = useState(1);
    const [goal, setGoal] = useState<Goal | null>(null);

    const [purchase, setPurchase] = useState<PurchaseDetails>(DEFAULT_PURCHASE);
    const [refi, setRefi] = useState<RefinanceDetails>(DEFAULT_REFI);
    const [lead, setLead] = useState<LeadDetails>(DEFAULT_LEAD);

    const [honeypot, setHoneypot] = useState("");
    const [submitStatus, setSubmitStatus] = useState<SubmitStatus>({ type: "idle" });
    const [errors, setErrors] = useState<FieldErrors>({});
    const [turnstileToken, setTurnstileToken] = useState("");

    const isPurchase = goal === "buy" || goal === "invest";

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (!raw) return;

            const parsed = JSON.parse(raw) as {
                step?: number;
                goal?: Goal | null;
                purchase?: Partial<PurchaseDetails>;
                refi?: Partial<RefinanceDetails>;
            };

            const restoredGoal =
                parsed.goal === "buy" || parsed.goal === "invest" || parsed.goal === "refinance"
                    ? parsed.goal
                    : null;

            const restoredPurchase = { ...DEFAULT_PURCHASE, ...(parsed.purchase || {}) };
            const restoredRefi = { ...DEFAULT_REFI, ...(parsed.refi || {}) };
            const maxRestorableStep = canRestoreToStep(
                restoredGoal,
                restoredPurchase,
                restoredRefi
            );

            setGoal(restoredGoal);
            setPurchase(restoredPurchase);
            setRefi(restoredRefi);

            if (parsed.step && parsed.step >= 1) {
                setStep(Math.min(parsed.step, maxRestorableStep));
            }
        } catch {
            // ignore bad storage
        }
    }, []);

    useEffect(() => {
        try {
            if (step >= 5) {
                sessionStorage.removeItem(STORAGE_KEY);
                return;
            }
            sessionStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    step: Math.min(step, 3),
                    goal,
                    purchase,
                    refi,
                })
            );
        } catch {
            // ignore storage errors
        }
    }, [step, goal, purchase, refi]);

    useEffect(() => {
        track("mortgage_lead_step_view", { step, goal });
    }, [step, goal]);

    useEffect(() => {
        headingRef.current?.focus();
    }, [step]);

    const previewEstimate: PreviewEstimate = useMemo(() => {
        if (!goal) return null;
        return isPurchase
            ? computePurchaseEstimate(purchase)
            : computeRefinanceEstimate(refi);
    }, [goal, isPurchase, purchase, refi]);

    const handleTurnstileToken = useCallback((token: string) => {
        setTurnstileToken(token);
        setErrors((prev) => {
            if (!prev.turnstile) return prev;
            const next = { ...prev };
            delete next.turnstile;
            return next;
        });
    }, []);

    const handleTurnstileExpired = useCallback(() => {
        setTurnstileToken("");
    }, []);

    function scrollTopSoft() {
        window.setTimeout(() => {
            topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 40);
    }

    function nextStep() {
        setStep((s) => Math.min(s + 1, 5));
        scrollTopSoft();
    }

    function prevStep() {
        setSubmitStatus({ type: "idle" });
        setStep((s) => Math.max(s - 1, 1));
        scrollTopSoft();
    }

    function clearFieldError(name: string) {
        setErrors((prev) => {
            if (!prev[name]) return prev;
            const next = { ...prev };
            delete next[name];
            return next;
        });
    }

    function validateStep1(): boolean {
        const nextErrors: FieldErrors = {};
        if (!goal) nextErrors.goal = "Please choose what you're trying to do.";
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    function validateStep2(): boolean {
        const nextErrors = isPurchase
            ? validatePurchaseDetails(purchase)
            : validateRefinanceDetails(refi);

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    function validateStep4(): boolean {
        const nextErrors: FieldErrors = {};

        if (lead.fullName.trim().length < 2) {
            nextErrors.fullName = "Enter your full name.";
        }
        if (!isValidEmail(lead.email)) {
            nextErrors.email = "Enter a valid email address.";
        }
        if (!isValidPhone(lead.phone)) {
            nextErrors.phone = "Enter a valid phone number.";
        }
        if (TURNSTILE_SITE_KEY && !turnstileToken) {
            nextErrors.turnstile = "Please complete the security check.";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    function handleContinueFromStep1() {
        if (!validateStep1()) return;
        track("mortgage_goal_selected", { goal });
        nextStep();
    }

    function handleContinueFromStep2() {
        if (!validateStep2()) return;
        track("mortgage_details_completed", { goal });
        nextStep();
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (submitStatus.type === "loading") return;
        if (!validateStep4()) return;

        setSubmitStatus({ type: "loading" });

        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 15000);

        try {
            const payload = {
                source: "website",
                formType: "mortgage_lead_magnet",
                previewVersion: PREVIEW_VERSION,
                goal,
                honeypot,
                rawInputs: isPurchase
                    ? {
                        ...purchase,
                        postcode: purchase.postcode.trim(),
                        listingUrl: purchase.listingUrl.trim(),
                    }
                    : {
                        ...refi,
                        postcode: refi.postcode.trim(),
                    },
                lead: {
                    fullName: lead.fullName.trim(),
                    email: lead.email.trim().toLowerCase(),
                    phone: sanitizePhone(lead.phone),
                },
                metadata: {
                    pagePath: typeof window !== "undefined" ? window.location.pathname : "",
                    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
                    submittedAtClient: new Date().toISOString(),
                    turnstileToken: turnstileToken || null,
                },
                previewEstimate,
            };

            const res = await fetch("/api/mortgage-broker-demo", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                signal: controller.signal,
                body: JSON.stringify(payload),
            });

            const maybeJson = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(
                    maybeJson?.message || "We couldn’t send your details right now. Please try again."
                );
            }

            setSubmitStatus({ type: "success" });
            setLead(DEFAULT_LEAD);
            setTurnstileToken("");
            setHoneypot("");
            sessionStorage.removeItem(STORAGE_KEY);
            track("mortgage_lead_submitted", { goal });
            nextStep();
        } catch (err) {
            setSubmitStatus({
                type: "error",
                message:
                    err instanceof Error
                        ? err.message
                        : "Something went wrong while submitting the form.",
            });
        } finally {
            clearTimeout(timeout);
        }
    }

    const sectionStyle: CSSProperties = {
        width: "100%",
        padding: "48px 0",
    };

    const cardStyle: CSSProperties = {
        maxWidth: 760,
        margin: "0 auto",
        borderRadius: 28,
        padding: 24,
        border: "1px solid var(--border, rgba(0,0,0,0.1))",
        background:
            "linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.78) 100%)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.06)",
        backdropFilter: "blur(8px)",
    };

    const grid3: CSSProperties = {
        display: "grid",
        gap: 14,
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    };

    const grid2: CSSProperties = {
        display: "grid",
        gap: 14,
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    };

    const inputStyle: CSSProperties = {
        width: "100%",
        borderRadius: 16,
        border: "1px solid var(--border, rgba(0,0,0,0.12))",
        padding: "14px 14px",
        fontSize: 15,
        outline: "none",
        background: "rgba(255,255,255,0.88)",
        color: "var(--text, #111827)",
    };

    const selectStyle: CSSProperties = inputStyle;

    const labelStyle: CSSProperties = {
        display: "block",
        marginBottom: 8,
        fontSize: 13,
        fontWeight: 700,
        color: "var(--text, #111827)",
    };

    const helpStyle: CSSProperties = {
        marginTop: 8,
        fontSize: 12,
        color: "var(--text-muted, #6b7280)",
    };

    const buttonPrimary: CSSProperties = {
        width: "100%",
        border: "none",
        borderRadius: 18,
        padding: "15px 18px",
        fontSize: 15,
        fontWeight: 800,
        cursor: "pointer",
        background: "var(--accent, #111827)",
        color: "#fff",
        marginTop: 10,
    };

    return (
        <section style={sectionStyle} ref={topRef}>
            <div
                className="container"
                style={{ maxWidth: 1080, padding: "0 20px", margin: "0 auto" }}
            >
                <div style={cardStyle}>
                    {step <= 4 ? <ProgressBar step={step} total={4} /> : null}

                    <div
                        aria-live="polite"
                        style={{
                            position: "absolute",
                            width: 1,
                            height: 1,
                            overflow: "hidden",
                            clipPath: "inset(50%)",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {submitStatus.type === "loading"
                            ? "Sending your details"
                            : submitStatus.type === "error"
                                ? submitStatus.message
                                : ""}
                    </div>

                    {step === 1 && (
                        <div>
                            <div
                                style={{
                                    display: "inline-flex",
                                    padding: "7px 12px",
                                    borderRadius: 999,
                                    background: "rgba(0,0,0,0.04)",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    marginBottom: 16,
                                }}
                            >
                                60-second estimate
                            </div>

                            <h1
                                ref={headingRef}
                                tabIndex={-1}
                                style={{
                                    fontSize: "clamp(2rem, 4vw, 3rem)",
                                    lineHeight: 1.02,
                                    letterSpacing: "-0.04em",
                                    margin: 0,
                                    color: "var(--text, #111827)",
                                    outline: "none",
                                }}
                            >
                                See where you stand before you speak to a broker.
                            </h1>

                            <p
                                style={{
                                    marginTop: 14,
                                    marginBottom: 24,
                                    fontSize: 16,
                                    lineHeight: 1.65,
                                    color: "var(--text-muted, #6b7280)",
                                    maxWidth: 680,
                                }}
                            >
                                Get a quick borrowing or refinance estimate first. Then decide if you want
                                the more detailed review.
                            </p>

                            <div style={{ display: "grid", gap: 12 }}>
                                <GoalButton
                                    selected={goal === "buy"}
                                    icon="🏡"
                                    label="Buy a home"
                                    onClick={() => {
                                        clearFieldError("goal");
                                        setGoal("buy");
                                    }}
                                />
                                <GoalButton
                                    selected={goal === "invest"}
                                    icon="📈"
                                    label="Buy an investment property"
                                    onClick={() => {
                                        clearFieldError("goal");
                                        setGoal("invest");
                                    }}
                                />
                                <GoalButton
                                    selected={goal === "refinance"}
                                    icon="🔄"
                                    label="Refinance my current loan"
                                    onClick={() => {
                                        clearFieldError("goal");
                                        setGoal("refinance");
                                    }}
                                />
                            </div>

                            <FieldError id="goal-error">{errors.goal}</FieldError>

                            <button
                                type="button"
                                onClick={handleContinueFromStep1}
                                style={buttonPrimary}
                            >
                                Continue →
                            </button>

                            <TrustRow />
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <BackButton onClick={prevStep} />

                            <div
                                style={{
                                    display: "inline-flex",
                                    padding: "7px 12px",
                                    borderRadius: 999,
                                    background: "rgba(0,0,0,0.04)",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    marginBottom: 16,
                                }}
                            >
                                {isPurchase ? "Your situation" : "Your current loan"}
                            </div>

                            <h2
                                ref={headingRef}
                                tabIndex={-1}
                                style={{
                                    fontSize: "clamp(1.7rem, 3vw, 2.4rem)",
                                    lineHeight: 1.05,
                                    letterSpacing: "-0.04em",
                                    margin: 0,
                                    outline: "none",
                                }}
                            >
                                {isPurchase
                                    ? "Enter a few details for your estimate"
                                    : "Enter a few details for your refinance check"}
                            </h2>

                            <p
                                style={{
                                    marginTop: 12,
                                    marginBottom: 22,
                                    fontSize: 15,
                                    lineHeight: 1.65,
                                    color: "var(--text-muted, #6b7280)",
                                }}
                            >
                                This first pass is designed to be quick. You’ll get your estimate on the
                                next screen.
                            </p>

                            {isPurchase ? (
                                <>
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={labelStyle}>Is this your first home? *</div>
                                        <div style={grid2}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    clearFieldError("isFirstHomeBuyer");
                                                    setPurchase((p) => ({ ...p, isFirstHomeBuyer: true }));
                                                }}
                                                style={{
                                                    ...buttonPrimary,
                                                    marginTop: 0,
                                                    background:
                                                        purchase.isFirstHomeBuyer === true
                                                            ? "var(--accent, #111827)"
                                                            : "transparent",
                                                    color:
                                                        purchase.isFirstHomeBuyer === true
                                                            ? "#fff"
                                                            : "var(--text, #111827)",
                                                    border:
                                                        purchase.isFirstHomeBuyer === true
                                                            ? "1px solid var(--accent, #111827)"
                                                            : "1px solid var(--border, rgba(0,0,0,0.12))",
                                                }}
                                                aria-pressed={purchase.isFirstHomeBuyer === true}
                                            >
                                                Yes
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    clearFieldError("isFirstHomeBuyer");
                                                    setPurchase((p) => ({ ...p, isFirstHomeBuyer: false }));
                                                }}
                                                style={{
                                                    ...buttonPrimary,
                                                    marginTop: 0,
                                                    background:
                                                        purchase.isFirstHomeBuyer === false
                                                            ? "var(--accent, #111827)"
                                                            : "transparent",
                                                    color:
                                                        purchase.isFirstHomeBuyer === false
                                                            ? "#fff"
                                                            : "var(--text, #111827)",
                                                    border:
                                                        purchase.isFirstHomeBuyer === false
                                                            ? "1px solid var(--accent, #111827)"
                                                            : "1px solid var(--border, rgba(0,0,0,0.12))",
                                                }}
                                                aria-pressed={purchase.isFirstHomeBuyer === false}
                                            >
                                                No
                                            </button>
                                        </div>
                                        <FieldError id="isFirstHomeBuyer-error">
                                            {errors.isFirstHomeBuyer}
                                        </FieldError>
                                    </div>

                                    <div style={grid2}>
                                        <div>
                                            <label htmlFor="propertyPrice" style={labelStyle}>
                                                Property price *
                                            </label>
                                            <input
                                                id="propertyPrice"
                                                inputMode="decimal"
                                                autoComplete="off"
                                                placeholder="e.g. 850000"
                                                value={purchase.propertyPrice}
                                                onChange={(e) => {
                                                    clearFieldError("propertyPrice");
                                                    setPurchase((p) => ({
                                                        ...p,
                                                        propertyPrice: e.target.value,
                                                    }));
                                                }}
                                                style={inputStyle}
                                                aria-invalid={Boolean(errors.propertyPrice)}
                                                aria-describedby={
                                                    errors.propertyPrice ? "propertyPrice-error" : undefined
                                                }
                                            />
                                            <FieldError id="propertyPrice-error">
                                                {errors.propertyPrice}
                                            </FieldError>
                                        </div>

                                        <div>
                                            <label htmlFor="deposit" style={labelStyle}>
                                                Deposit saved *
                                            </label>
                                            <input
                                                id="deposit"
                                                inputMode="decimal"
                                                autoComplete="off"
                                                placeholder="e.g. 130000"
                                                value={purchase.deposit}
                                                onChange={(e) => {
                                                    clearFieldError("deposit");
                                                    setPurchase((p) => ({
                                                        ...p,
                                                        deposit: e.target.value,
                                                    }));
                                                }}
                                                style={inputStyle}
                                                aria-invalid={Boolean(errors.deposit)}
                                                aria-describedby={errors.deposit ? "deposit-error" : undefined}
                                            />
                                            <FieldError id="deposit-error">{errors.deposit}</FieldError>
                                        </div>
                                    </div>

                                    <div style={{ ...grid2, marginTop: 14 }}>
                                        <div>
                                            <label htmlFor="annualIncome" style={labelStyle}>
                                                Annual income *
                                            </label>
                                            <input
                                                id="annualIncome"
                                                inputMode="decimal"
                                                autoComplete="off"
                                                placeholder="e.g. 120000"
                                                value={purchase.annualIncome}
                                                onChange={(e) => {
                                                    clearFieldError("annualIncome");
                                                    setPurchase((p) => ({
                                                        ...p,
                                                        annualIncome: e.target.value,
                                                    }));
                                                }}
                                                style={inputStyle}
                                                aria-invalid={Boolean(errors.annualIncome)}
                                                aria-describedby={
                                                    errors.annualIncome ? "annualIncome-error" : undefined
                                                }
                                            />
                                            <FieldError id="annualIncome-error">
                                                {errors.annualIncome}
                                            </FieldError>
                                        </div>

                                        <div>
                                            <label htmlFor="secondIncome" style={labelStyle}>
                                                Second income
                                            </label>
                                            <input
                                                id="secondIncome"
                                                inputMode="decimal"
                                                autoComplete="off"
                                                placeholder="Optional"
                                                value={purchase.secondIncome}
                                                onChange={(e) => {
                                                    clearFieldError("secondIncome");
                                                    setPurchase((p) => ({
                                                        ...p,
                                                        secondIncome: e.target.value,
                                                    }));
                                                }}
                                                style={inputStyle}
                                                aria-invalid={Boolean(errors.secondIncome)}
                                                aria-describedby={
                                                    errors.secondIncome ? "secondIncome-error" : "secondIncome-help"
                                                }
                                            />
                                            <div id="secondIncome-help" style={helpStyle}>
                                                Optional, for joint applications.
                                            </div>
                                            <FieldError id="secondIncome-error">
                                                {errors.secondIncome}
                                            </FieldError>
                                        </div>
                                    </div>

                                    <div style={{ ...grid2, marginTop: 14 }}>
                                        <div>
                                            <label htmlFor="monthlyDebts" style={labelStyle}>
                                                Monthly debts *
                                            </label>
                                            <input
                                                id="monthlyDebts"
                                                inputMode="decimal"
                                                autoComplete="off"
                                                placeholder="e.g. 800"
                                                value={purchase.monthlyDebts}
                                                onChange={(e) => {
                                                    clearFieldError("monthlyDebts");
                                                    setPurchase((p) => ({
                                                        ...p,
                                                        monthlyDebts: e.target.value,
                                                    }));
                                                }}
                                                style={inputStyle}
                                                aria-invalid={Boolean(errors.monthlyDebts)}
                                                aria-describedby={
                                                    errors.monthlyDebts ? "monthlyDebts-error" : "monthlyDebts-help"
                                                }
                                            />
                                            <div id="monthlyDebts-help" style={helpStyle}>
                                                Car loans, personal loans, cards, etc.
                                            </div>
                                            <FieldError id="monthlyDebts-error">
                                                {errors.monthlyDebts}
                                            </FieldError>
                                        </div>

                                        <div>
                                            <label htmlFor="employmentType" style={labelStyle}>
                                                Employment type *
                                            </label>
                                            <select
                                                id="employmentType"
                                                value={purchase.employmentType}
                                                onChange={(e) => {
                                                    clearFieldError("employmentType");
                                                    setPurchase((p) => ({
                                                        ...p,
                                                        employmentType: e.target.value as EmploymentType | "",
                                                    }));
                                                }}
                                                style={selectStyle}
                                                aria-invalid={Boolean(errors.employmentType)}
                                                aria-describedby={
                                                    errors.employmentType ? "employmentType-error" : undefined
                                                }
                                            >
                                                <option value="">Choose…</option>
                                                <option value="full_time">Full-time</option>
                                                <option value="part_time">Part-time</option>
                                                <option value="casual">Casual</option>
                                                <option value="self_employed">Self-employed</option>
                                                <option value="contractor">Contractor</option>
                                            </select>
                                            <FieldError id="employmentType-error">
                                                {errors.employmentType}
                                            </FieldError>
                                        </div>
                                    </div>

                                    <div style={{ ...grid2, marginTop: 14 }}>
                                        <div>
                                            <label htmlFor="purchasePostcode" style={labelStyle}>
                                                Postcode *
                                            </label>
                                            <input
                                                id="purchasePostcode"
                                                inputMode="numeric"
                                                autoComplete="postal-code"
                                                placeholder="e.g. 2000"
                                                value={purchase.postcode}
                                                onChange={(e) => {
                                                    clearFieldError("postcode");
                                                    setPurchase((p) => ({
                                                        ...p,
                                                        postcode: parseDigits(e.target.value).slice(0, 4),
                                                    }));
                                                }}
                                                style={inputStyle}
                                                maxLength={4}
                                                aria-invalid={Boolean(errors.postcode)}
                                                aria-describedby={errors.postcode ? "purchasePostcode-error" : undefined}
                                            />
                                            <FieldError id="purchasePostcode-error">
                                                {errors.postcode}
                                            </FieldError>
                                        </div>

                                        <div>
                                            <label htmlFor="listingUrl" style={labelStyle}>
                                                Property link
                                            </label>
                                            <input
                                                id="listingUrl"
                                                inputMode="url"
                                                autoComplete="off"
                                                placeholder="Optional"
                                                value={purchase.listingUrl}
                                                onChange={(e) => {
                                                    clearFieldError("listingUrl");
                                                    setPurchase((p) => ({
                                                        ...p,
                                                        listingUrl: e.target.value,
                                                    }));
                                                }}
                                                style={inputStyle}
                                                aria-invalid={Boolean(errors.listingUrl)}
                                                aria-describedby={
                                                    errors.listingUrl ? "listingUrl-error" : "listingUrl-help"
                                                }
                                            />
                                            <div id="listingUrl-help" style={helpStyle}>
                                                Optional. Paste a realestate or domain link.
                                            </div>
                                            <FieldError id="listingUrl-error">
                                                {errors.listingUrl}
                                            </FieldError>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={grid2}>
                                        <div>
                                            <label htmlFor="loanBalance" style={labelStyle}>
                                                Current loan balance *
                                            </label>
                                            <input
                                                id="loanBalance"
                                                inputMode="decimal"
                                                autoComplete="off"
                                                placeholder="e.g. 540000"
                                                value={refi.loanBalance}
                                                onChange={(e) => {
                                                    clearFieldError("loanBalance");
                                                    setRefi((r) => ({
                                                        ...r,
                                                        loanBalance: e.target.value,
                                                    }));
                                                }}
                                                style={inputStyle}
                                                aria-invalid={Boolean(errors.loanBalance)}
                                                aria-describedby={
                                                    errors.loanBalance ? "loanBalance-error" : undefined
                                                }
                                            />
                                            <FieldError id="loanBalance-error">
                                                {errors.loanBalance}
                                            </FieldError>
                                        </div>

                                        <div>
                                            <label htmlFor="interestRate" style={labelStyle}>
                                                Current interest rate (%) *
                                            </label>
                                            <input
                                                id="interestRate"
                                                inputMode="decimal"
                                                autoComplete="off"
                                                placeholder="e.g. 6.49"
                                                value={refi.interestRate}
                                                onChange={(e) => {
                                                    clearFieldError("interestRate");
                                                    setRefi((r) => ({
                                                        ...r,
                                                        interestRate: e.target.value,
                                                    }));
                                                }}
                                                style={inputStyle}
                                                aria-invalid={Boolean(errors.interestRate)}
                                                aria-describedby={
                                                    errors.interestRate ? "interestRate-error" : undefined
                                                }
                                            />
                                            <FieldError id="interestRate-error">
                                                {errors.interestRate}
                                            </FieldError>
                                        </div>
                                    </div>

                                    <div style={{ ...grid2, marginTop: 14 }}>
                                        <div>
                                            <label htmlFor="loanTermYears" style={labelStyle}>
                                                Remaining term (years) *
                                            </label>
                                            <input
                                                id="loanTermYears"
                                                inputMode="numeric"
                                                autoComplete="off"
                                                placeholder="e.g. 25"
                                                value={refi.loanTermYears}
                                                onChange={(e) => {
                                                    clearFieldError("loanTermYears");
                                                    setRefi((r) => ({
                                                        ...r,
                                                        loanTermYears: e.target.value,
                                                    }));
                                                }}
                                                style={inputStyle}
                                                aria-invalid={Boolean(errors.loanTermYears)}
                                                aria-describedby={
                                                    errors.loanTermYears ? "loanTermYears-error" : undefined
                                                }
                                            />
                                            <FieldError id="loanTermYears-error">
                                                {errors.loanTermYears}
                                            </FieldError>
                                        </div>

                                        <div>
                                            <label htmlFor="propertyValue" style={labelStyle}>
                                                Estimated property value *
                                            </label>
                                            <input
                                                id="propertyValue"
                                                inputMode="decimal"
                                                autoComplete="off"
                                                placeholder="e.g. 820000"
                                                value={refi.propertyValue}
                                                onChange={(e) => {
                                                    clearFieldError("propertyValue");
                                                    setRefi((r) => ({
                                                        ...r,
                                                        propertyValue: e.target.value,
                                                    }));
                                                }}
                                                style={inputStyle}
                                                aria-invalid={Boolean(errors.propertyValue)}
                                                aria-describedby={
                                                    errors.propertyValue ? "propertyValue-error" : undefined
                                                }
                                            />
                                            <FieldError id="propertyValue-error">
                                                {errors.propertyValue}
                                            </FieldError>
                                        </div>
                                    </div>

                                    <div style={{ ...grid2, marginTop: 14 }}>
                                        <div>
                                            <label htmlFor="currentRepayment" style={labelStyle}>
                                                Current monthly repayment
                                            </label>
                                            <input
                                                id="currentRepayment"
                                                inputMode="decimal"
                                                autoComplete="off"
                                                placeholder="Optional"
                                                value={refi.currentRepayment}
                                                onChange={(e) => {
                                                    clearFieldError("currentRepayment");
                                                    setRefi((r) => ({
                                                        ...r,
                                                        currentRepayment: e.target.value,
                                                    }));
                                                }}
                                                style={inputStyle}
                                                aria-invalid={Boolean(errors.currentRepayment)}
                                                aria-describedby={
                                                    errors.currentRepayment
                                                        ? "currentRepayment-error"
                                                        : "currentRepayment-help"
                                                }
                                            />
                                            <div id="currentRepayment-help" style={helpStyle}>
                                                Optional. Helps tighten the preview.
                                            </div>
                                            <FieldError id="currentRepayment-error">
                                                {errors.currentRepayment}
                                            </FieldError>
                                        </div>

                                        <div>
                                            <label htmlFor="refiPostcode" style={labelStyle}>
                                                Postcode *
                                            </label>
                                            <input
                                                id="refiPostcode"
                                                inputMode="numeric"
                                                autoComplete="postal-code"
                                                placeholder="e.g. 2000"
                                                value={refi.postcode}
                                                onChange={(e) => {
                                                    clearFieldError("postcode");
                                                    setRefi((r) => ({
                                                        ...r,
                                                        postcode: parseDigits(e.target.value).slice(0, 4),
                                                    }));
                                                }}
                                                style={inputStyle}
                                                maxLength={4}
                                                aria-invalid={Boolean(errors.postcode)}
                                                aria-describedby={errors.postcode ? "refiPostcode-error" : undefined}
                                            />
                                            <FieldError id="refiPostcode-error">
                                                {errors.postcode}
                                            </FieldError>
                                        </div>
                                    </div>
                                </>
                            )}

                            <button
                                type="button"
                                onClick={handleContinueFromStep2}
                                style={buttonPrimary}
                            >
                                See My Estimate →
                            </button>
                        </div>
                    )}

                    {step === 3 && previewEstimate && (
                        <div>
                            <BackButton onClick={prevStep} />

                            <div
                                style={{
                                    display: "inline-flex",
                                    padding: "7px 12px",
                                    borderRadius: 999,
                                    background: "rgba(0,0,0,0.04)",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    marginBottom: 16,
                                }}
                            >
                                Your estimate
                            </div>

                            <h2
                                ref={headingRef}
                                tabIndex={-1}
                                style={{
                                    fontSize: "clamp(1.7rem, 3vw, 2.4rem)",
                                    lineHeight: 1.05,
                                    letterSpacing: "-0.04em",
                                    margin: 0,
                                    outline: "none",
                                }}
                            >
                                {previewEstimate.kind === "purchase"
                                    ? "Here’s your estimated borrowing snapshot"
                                    : "Here’s your estimated refinance snapshot"}
                            </h2>

                            <p
                                style={{
                                    marginTop: 12,
                                    marginBottom: 22,
                                    fontSize: 15,
                                    lineHeight: 1.65,
                                    color: "var(--text-muted, #6b7280)",
                                }}
                            >
                                This is a quick estimate, not lender approval or financial advice. A full
                                review can be more accurate once a broker checks the finer details.
                            </p>

                            {previewEstimate.kind === "purchase" ? (
                                <>
                                    <div style={grid3}>
                                        <StatCard
                                            label="Estimated borrowing range"
                                            value={fmtRange(
                                                previewEstimate.borrowingLow,
                                                previewEstimate.borrowingHigh
                                            )}
                                            emphasized
                                        />
                                        <StatCard
                                            label="Estimated total budget"
                                            value={fmtRange(
                                                previewEstimate.budgetLow,
                                                previewEstimate.budgetHigh
                                            )}
                                        />
                                        <StatCard
                                            label="Estimated monthly repayment"
                                            value={fmtRange(
                                                previewEstimate.repaymentLow,
                                                previewEstimate.repaymentHigh
                                            )}
                                        />
                                    </div>

                                    <div style={{ marginTop: 14 }}>
                                        <Notice
                                            tone={
                                                previewEstimate.position === "within"
                                                    ? "success"
                                                    : previewEstimate.position === "close"
                                                        ? "warning"
                                                        : "neutral"
                                            }
                                        >
                                            <strong>
                                                {previewEstimate.position === "within"
                                                    ? "Likely within range."
                                                    : previewEstimate.position === "close"
                                                        ? "Close, but structure may matter."
                                                        : "Likely short right now."}
                                            </strong>{" "}
                                            {previewEstimate.propertyPrice > 0
                                                ? previewEstimate.position === "within"
                                                    ? "Based on the numbers entered, the property appears to sit inside your estimated range."
                                                    : previewEstimate.position === "close"
                                                        ? "On a better-case view, you may be close enough for a broker to improve the structure."
                                                        : `On a better-case view, you may still be about ${fmtAUD(
                                                            previewEstimate.bestCaseShortfall
                                                        )} short of the target property.`
                                                : "Add a property price to compare your estimated budget against a target purchase."}
                                        </Notice>
                                    </div>

                                    <div style={{ marginTop: 16, ...grid3 }}>
                                        {previewEstimate.insightLines.map((line) => (
                                            <Notice key={line} tone="neutral">
                                                {line}
                                            </Notice>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={grid3}>
                                        <StatCard
                                            label="Current repayment benchmark"
                                            value={fmtAUD(previewEstimate.currentRepaymentEstimate)}
                                            emphasized
                                        />
                                        <StatCard
                                            label="Possible repayment range"
                                            value={fmtRange(
                                                previewEstimate.improvedRepaymentLow,
                                                previewEstimate.improvedRepaymentHigh
                                            )}
                                        />
                                        <StatCard
                                            label="Possible monthly savings"
                                            value={fmtRange(
                                                previewEstimate.savingsLow,
                                                previewEstimate.savingsHigh
                                            )}
                                        />
                                    </div>

                                    <div style={{ marginTop: 14 }}>
                                        <Notice
                                            tone={
                                                previewEstimate.position === "strong"
                                                    ? "success"
                                                    : previewEstimate.position === "possible"
                                                        ? "warning"
                                                        : "neutral"
                                            }
                                        >
                                            <strong>
                                                {previewEstimate.position === "strong"
                                                    ? "This looks worth reviewing."
                                                    : previewEstimate.position === "possible"
                                                        ? "There may be savings here."
                                                        : "This may need a deeper review."}
                                            </strong>{" "}
                                            {previewEstimate.lvr !== null
                                                ? `Your estimated LVR is about ${previewEstimate.lvr.toFixed(
                                                    1
                                                )}%.`
                                                : "A broker can usually sharpen this further with your existing statements and loan details."}
                                        </Notice>
                                    </div>

                                    <div style={{ marginTop: 16, ...grid3 }}>
                                        {previewEstimate.insightLines.map((line) => (
                                            <Notice key={line} tone="neutral">
                                                {line}
                                            </Notice>
                                        ))}
                                    </div>
                                </>
                            )}

                            <div
                                style={{
                                    marginTop: 18,
                                    border: "1px solid var(--border, rgba(0,0,0,0.12))",
                                    borderRadius: 24,
                                    padding: 20,
                                    position: "relative",
                                    overflow: "hidden",
                                    background:
                                        "linear-gradient(180deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.38) 100%)",
                                }}
                            >
                                <div
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        backdropFilter: "blur(6px)",
                                        background:
                                            "linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.35))",
                                    }}
                                />
                                <div style={{ position: "relative", zIndex: 1 }}>
                                    <div
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 8,
                                            fontSize: 12,
                                            fontWeight: 800,
                                            marginBottom: 10,
                                        }}
                                    >
                                        🔒 Detailed summary
                                    </div>

                                    <h3
                                        style={{
                                            margin: 0,
                                            fontSize: 20,
                                            lineHeight: 1.15,
                                            letterSpacing: "-0.03em",
                                        }}
                                    >
                                        Unlock your more detailed next-step summary
                                    </h3>

                                    <p
                                        style={{
                                            marginTop: 10,
                                            marginBottom: 14,
                                            fontSize: 14,
                                            lineHeight: 1.6,
                                            color: "var(--text-muted, #6b7280)",
                                            maxWidth: 620,
                                        }}
                                    >
                                        We’ll send a personalised summary with your estimate, likely friction
                                        points, and the smartest next move based on what you entered.
                                    </p>

                                    <ul
                                        style={{
                                            margin: "0 0 18px 0",
                                            paddingLeft: 18,
                                            color: "var(--text, #111827)",
                                            lineHeight: 1.65,
                                            fontSize: 14,
                                        }}
                                    >
                                        <li>More detailed scenario notes</li>
                                        <li>What may improve your position fastest</li>
                                        <li>Optional broker review if you want it</li>
                                    </ul>

                                    <button type="button" onClick={nextStep} style={buttonPrimary}>
                                        Unlock My Detailed Summary →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div>
                            <BackButton onClick={prevStep} />

                            <div
                                style={{
                                    display: "inline-flex",
                                    padding: "7px 12px",
                                    borderRadius: 999,
                                    background: "rgba(0,0,0,0.04)",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    marginBottom: 16,
                                }}
                            >
                                Send the summary
                            </div>

                            <h2
                                ref={headingRef}
                                tabIndex={-1}
                                style={{
                                    fontSize: "clamp(1.7rem, 3vw, 2.4rem)",
                                    lineHeight: 1.05,
                                    letterSpacing: "-0.04em",
                                    margin: 0,
                                    outline: "none",
                                }}
                            >
                                Where should we send it?
                            </h2>

                            <p
                                style={{
                                    marginTop: 12,
                                    marginBottom: 22,
                                    fontSize: 15,
                                    lineHeight: 1.65,
                                    color: "var(--text-muted, #6b7280)",
                                    maxWidth: 680,
                                }}
                            >
                                You’ll receive your detailed summary next. If it looks like a strong fit,
                                you can choose whether you want a broker to review it.
                            </p>

                            <form onSubmit={handleSubmit} noValidate>
                                <input
                                    tabIndex={-1}
                                    aria-hidden="true"
                                    autoComplete="off"
                                    value={honeypot}
                                    onChange={(e) => setHoneypot(e.target.value)}
                                    name="company_website"
                                    style={{
                                        position: "absolute",
                                        opacity: 0,
                                        pointerEvents: "none",
                                        width: 1,
                                        height: 1,
                                    }}
                                />

                                <div style={grid2}>
                                    <div>
                                        <label htmlFor="fullName" style={labelStyle}>
                                            Full name *
                                        </label>
                                        <input
                                            id="fullName"
                                            autoComplete="name"
                                            placeholder="Alex Smith"
                                            value={lead.fullName}
                                            onChange={(e) => {
                                                clearFieldError("fullName");
                                                setLead((l) => ({ ...l, fullName: e.target.value }));
                                            }}
                                            style={inputStyle}
                                            aria-invalid={Boolean(errors.fullName)}
                                            aria-describedby={errors.fullName ? "fullName-error" : undefined}
                                        />
                                        <FieldError id="fullName-error">{errors.fullName}</FieldError>
                                    </div>

                                    <div>
                                        <label htmlFor="phone" style={labelStyle}>
                                            Mobile number *
                                        </label>
                                        <input
                                            id="phone"
                                            type="tel"
                                            autoComplete="tel"
                                            inputMode="tel"
                                            placeholder="04XX XXX XXX"
                                            value={lead.phone}
                                            onChange={(e) => {
                                                clearFieldError("phone");
                                                setLead((l) => ({ ...l, phone: e.target.value }));
                                            }}
                                            style={inputStyle}
                                            aria-invalid={Boolean(errors.phone)}
                                            aria-describedby={errors.phone ? "phone-error" : undefined}
                                        />
                                        <FieldError id="phone-error">{errors.phone}</FieldError>
                                    </div>
                                </div>

                                <div style={{ marginTop: 14 }}>
                                    <label htmlFor="email" style={labelStyle}>
                                        Email address *
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        inputMode="email"
                                        placeholder="alex@email.com"
                                        value={lead.email}
                                        onChange={(e) => {
                                            clearFieldError("email");
                                            setLead((l) => ({ ...l, email: e.target.value }));
                                        }}
                                        style={inputStyle}
                                        aria-invalid={Boolean(errors.email)}
                                        aria-describedby={errors.email ? "email-error" : undefined}
                                    />
                                    <FieldError id="email-error">{errors.email}</FieldError>
                                </div>

                                <TurnstileWidget
                                    siteKey={TURNSTILE_SITE_KEY}
                                    onToken={handleTurnstileToken}
                                    onExpired={handleTurnstileExpired}
                                />

                                <FieldError id="turnstile-error">{errors.turnstile}</FieldError>

                                <button
                                    type="submit"
                                    disabled={submitStatus.type === "loading"}
                                    style={{
                                        ...buttonPrimary,
                                        opacity: submitStatus.type === "loading" ? 0.75 : 1,
                                        marginTop: 16,
                                    }}
                                >
                                    {submitStatus.type === "loading"
                                        ? "Sending…"
                                        : "Send My Detailed Summary →"}
                                </button>

                                {submitStatus.type === "error" ? (
                                    <div
                                        role="alert"
                                        style={{
                                            marginTop: 12,
                                            fontSize: 12,
                                            color: "#b91c1c",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {submitStatus.message}
                                    </div>
                                ) : null}

                                <p
                                    style={{
                                        marginTop: 14,
                                        marginBottom: 0,
                                        fontSize: 12,
                                        lineHeight: 1.6,
                                        color: "var(--text-muted, #6b7280)",
                                    }}
                                >
                                    By submitting, you agree to be contacted about your enquiry. This is an
                                    estimate only and not financial advice.
                                </p>
                            </form>
                        </div>
                    )}

                    {step === 5 && (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "18px 0 4px",
                            }}
                        >
                            <div
                                style={{
                                    width: 74,
                                    height: 74,
                                    borderRadius: 999,
                                    display: "grid",
                                    placeItems: "center",
                                    margin: "0 auto 16px",
                                    fontSize: 28,
                                    fontWeight: 900,
                                    background: "rgba(16,185,129,0.12)",
                                    color: "#059669",
                                }}
                            >
                                ✓
                            </div>

                            <div
                                style={{
                                    display: "inline-flex",
                                    padding: "7px 12px",
                                    borderRadius: 999,
                                    background: "rgba(0,0,0,0.04)",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    marginBottom: 14,
                                }}
                            >
                                All set
                            </div>

                            <h2
                                ref={headingRef}
                                tabIndex={-1}
                                style={{
                                    fontSize: "clamp(1.9rem, 4vw, 2.8rem)",
                                    lineHeight: 1.03,
                                    letterSpacing: "-0.04em",
                                    margin: 0,
                                    outline: "none",
                                }}
                            >
                                Your summary is on the way
                                {lead.fullName ? `, ${lead.fullName.split(" ")[0]}` : ""}.
                            </h2>

                            <p
                                style={{
                                    marginTop: 14,
                                    marginBottom: 24,
                                    fontSize: 16,
                                    lineHeight: 1.65,
                                    color: "var(--text-muted, #6b7280)",
                                    maxWidth: 650,
                                    marginInline: "auto",
                                }}
                            >
                                We’ve received your details. The next message should include your summary
                                and the clearest next step based on what you entered.
                            </p>

                            <div
                                style={{
                                    maxWidth: 720,
                                    margin: "0 auto",
                                    display: "grid",
                                    gap: 14,
                                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                }}
                            >
                                <Notice tone="neutral">Personalised estimate summary</Notice>
                                <Notice tone="neutral">Clear next-step guidance</Notice>
                                <Notice tone="neutral">Optional broker review if you want it</Notice>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}