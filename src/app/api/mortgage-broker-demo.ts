import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

type IncomingPayload = {
    source?: string;
    formType?: string;
    previewVersion?: string;
    goal?: Goal;
    honeypot?: string;
    rawInputs?: PurchaseDetails | RefinanceDetails;
    lead?: LeadDetails;
    metadata?: {
        pagePath?: string;
        userAgent?: string;
        submittedAtClient?: string;
        turnstileToken?: string | null;
    };
    previewEstimate?: unknown;
};

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 8;

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function json(
    body: Record<string, unknown>,
    status = 200
): NextResponse<Record<string, unknown>> {
    return NextResponse.json(body, {
        status,
        headers: { "Cache-Control": "no-store" },
    });
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

function sanitizePhone(phone: string): string {
    return phone.replace(/[^\d+ ]/g, "").replace(/\s+/g, " ").trim();
}

function sanitizeText(value: unknown, max = 500): string {
    if (typeof value !== "string") return "";
    return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhone(phone: string): boolean {
    const digits = parseDigits(phone);
    return digits.length >= 8 && digits.length <= 15;
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

function getClientIp(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        const first = forwarded.split(",")[0]?.trim();
        if (first) return first;
    }
    const realIp = request.headers.get("x-real-ip");
    return realIp?.trim() || "unknown";
}

function enforceOrigin(request: NextRequest): boolean {
    const allowedOrigin = process.env.APP_BASE_URL?.replace(/\/$/, "");
    if (!allowedOrigin) return true;

    const origin = request.headers.get("origin")?.replace(/\/$/, "");
    if (!origin) return true;

    return origin === allowedOrigin;
}

function rateLimit(key: string): boolean {
    const now = Date.now();

    for (const [k, value] of rateLimitStore.entries()) {
        if (value.resetAt <= now) rateLimitStore.delete(k);
    }

    const existing = rateLimitStore.get(key);

    if (!existing || existing.resetAt <= now) {
        rateLimitStore.set(key, {
            count: 1,
            resetAt: now + RATE_LIMIT_WINDOW_MS,
        });
        return true;
    }

    if (existing.count >= RATE_LIMIT_MAX) {
        return false;
    }

    existing.count += 1;
    rateLimitStore.set(key, existing);
    return true;
}

function validatePayload(body: IncomingPayload) {
    const goal = body.goal;
    if (goal !== "buy" && goal !== "invest" && goal !== "refinance") {
        return { ok: false as const, message: "Invalid goal." };
    }

    const fullName = sanitizeText(body.lead?.fullName, 120);
    const email = sanitizeText(body.lead?.email, 200).toLowerCase();
    const phone = sanitizePhone(sanitizeText(body.lead?.phone, 40));

    if (fullName.length < 2) {
        return { ok: false as const, message: "Invalid full name." };
    }
    if (!isValidEmail(email)) {
        return { ok: false as const, message: "Invalid email address." };
    }
    if (!isValidPhone(phone)) {
        return { ok: false as const, message: "Invalid phone number." };
    }

    const rawInputs = body.rawInputs;
    if (!rawInputs || typeof rawInputs !== "object") {
        return { ok: false as const, message: "Missing form inputs." };
    }

    if (goal === "buy" || goal === "invest") {
        const purchase = rawInputs as PurchaseDetails;

        const propertyPrice = parseMoney(String(purchase.propertyPrice || ""));
        const deposit = parseMoney(String(purchase.deposit || ""));
        const annualIncome = parseMoney(String(purchase.annualIncome || ""));
        const secondIncome = parseMoney(String(purchase.secondIncome || ""));
        const monthlyDebts = parseMoney(String(purchase.monthlyDebts || ""));
        const postcode = sanitizeText(purchase.postcode, 4);
        const listingUrl = sanitizeText(purchase.listingUrl, 500);

        if (purchase.isFirstHomeBuyer !== true && purchase.isFirstHomeBuyer !== false) {
            return { ok: false as const, message: "Please choose whether this is your first home." };
        }
        if (propertyPrice < 100000 || propertyPrice > 20000000) {
            return { ok: false as const, message: "Invalid property price." };
        }
        if (deposit < 5000 || deposit > 10000000) {
            return { ok: false as const, message: "Invalid deposit amount." };
        }
        if (annualIncome < 20000 || annualIncome > 2000000) {
            return { ok: false as const, message: "Invalid annual income." };
        }
        if (purchase.secondIncome && (secondIncome < 0 || secondIncome > 2000000)) {
            return { ok: false as const, message: "Invalid second income." };
        }
        if (monthlyDebts < 0 || monthlyDebts > 50000) {
            return { ok: false as const, message: "Invalid monthly debts." };
        }
        if (
            purchase.employmentType !== "full_time" &&
            purchase.employmentType !== "part_time" &&
            purchase.employmentType !== "casual" &&
            purchase.employmentType !== "self_employed" &&
            purchase.employmentType !== "contractor"
        ) {
            return { ok: false as const, message: "Invalid employment type." };
        }
        if (!isValidPostcode(postcode)) {
            return { ok: false as const, message: "Invalid postcode." };
        }
        if (!isValidUrl(listingUrl)) {
            return { ok: false as const, message: "Invalid property link." };
        }

        return {
            ok: true as const,
            cleaned: {
                goal,
                lead: {
                    fullName,
                    email,
                    phone,
                },
                rawInputs: {
                    isFirstHomeBuyer: purchase.isFirstHomeBuyer,
                    propertyPrice: String(propertyPrice),
                    deposit: String(deposit),
                    annualIncome: String(annualIncome),
                    secondIncome: String(secondIncome),
                    monthlyDebts: String(monthlyDebts),
                    postcode,
                    employmentType: purchase.employmentType,
                    listingUrl,
                },
            },
        };
    }

    const refi = rawInputs as RefinanceDetails;
    const loanBalance = parseMoney(String(refi.loanBalance || ""));
    const interestRate = parseMoney(String(refi.interestRate || ""));
    const loanTermYears = parseMoney(String(refi.loanTermYears || ""));
    const propertyValue = parseMoney(String(refi.propertyValue || ""));
    const currentRepayment = parseMoney(String(refi.currentRepayment || ""));
    const postcode = sanitizeText(refi.postcode, 4);

    if (loanBalance < 10000 || loanBalance > 20000000) {
        return { ok: false as const, message: "Invalid loan balance." };
    }
    if (interestRate <= 0 || interestRate > 20) {
        return { ok: false as const, message: "Invalid interest rate." };
    }
    if (loanTermYears < 1 || loanTermYears > 40) {
        return { ok: false as const, message: "Invalid remaining term." };
    }
    if (propertyValue < 50000 || propertyValue > 25000000) {
        return { ok: false as const, message: "Invalid property value." };
    }
    if (refi.currentRepayment && (currentRepayment <= 0 || currentRepayment > 50000)) {
        return { ok: false as const, message: "Invalid current repayment." };
    }
    if (!isValidPostcode(postcode)) {
        return { ok: false as const, message: "Invalid postcode." };
    }

    return {
        ok: true as const,
        cleaned: {
            goal,
            lead: {
                fullName,
                email,
                phone,
            },
            rawInputs: {
                loanBalance: String(loanBalance),
                interestRate: String(interestRate),
                loanTermYears: String(loanTermYears),
                propertyValue: String(propertyValue),
                currentRepayment: String(currentRepayment),
                postcode,
            },
        },
    };
}

async function verifyTurnstileToken(token: string, ip: string) {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) return true;

    const formData = new URLSearchParams();
    formData.set("secret", secret);
    formData.set("response", token);
    if (ip && ip !== "unknown") formData.set("remoteip", ip);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const res = await fetch(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData.toString(),
                signal: controller.signal,
                cache: "no-store",
            }
        );

        const data = (await res.json().catch(() => null)) as
            | { success?: boolean }
            | null;

        return Boolean(data?.success);
    } finally {
        clearTimeout(timeout);
    }
}

export async function POST(request: NextRequest) {
    if (!enforceOrigin(request)) {
        return json({ message: "Forbidden origin." }, 403);
    }

    const ip = getClientIp(request);

    if (!rateLimit(`mortgage-lead:${ip}`)) {
        return json(
            { message: "Too many attempts. Please wait a few minutes and try again." },
            429
        );
    }

    let body: IncomingPayload;

    try {
        body = (await request.json()) as IncomingPayload;
    } catch {
        return json({ message: "Invalid JSON payload." }, 400);
    }

    const honeypot = sanitizeText(body.honeypot, 200);
    if (honeypot) {
        return json({ ok: true });
    }

    const validated = validatePayload(body);
    if (!validated.ok) {
        return json({ message: validated.message }, 400);
    }

    const turnstileSecretConfigured = Boolean(process.env.TURNSTILE_SECRET_KEY);
    const turnstileToken = sanitizeText(body.metadata?.turnstileToken, 4000);

    if (turnstileSecretConfigured) {
        if (!turnstileToken) {
            return json({ message: "Security check required." }, 400);
        }

        const passed = await verifyTurnstileToken(turnstileToken, ip);
        if (!passed) {
            return json({ message: "Security check failed. Please try again." }, 400);
        }
    }

    const webhookUrl = process.env.MORTGAGE_BROKER_DEMO_N8N_WEBHOOK_URL;
    if (!webhookUrl) {
        return json({ message: "Server is missing MORTGAGE_BROKER_DEMO_N8N_WEBHOOK_URL." }, 500);
    }

    const forwardedPayload = {
        source: sanitizeText(body.source, 80) || "website",
        formType: sanitizeText(body.formType, 80) || "mortgage_lead_magnet",
        previewVersion: sanitizeText(body.previewVersion, 80) || "frontend_preview_v3",
        goal: validated.cleaned.goal,
        rawInputs: validated.cleaned.rawInputs,
        lead: validated.cleaned.lead,
        previewEstimate: body.previewEstimate ?? null,
        metadata: {
            pagePath: sanitizeText(body.metadata?.pagePath, 300),
            clientUserAgent: sanitizeText(body.metadata?.userAgent, 500),
            submittedAtClient: sanitizeText(body.metadata?.submittedAtClient, 80),
            receivedAtServer: new Date().toISOString(),
            ip,
            serverRoute: "/api/mortgage-lead",
        },
    };

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (process.env.MORTGAGE_WEBHOOK_SHARED_SECRET) {
        headers["x-webhook-secret"] = process.env.MORTGAGE_WEBHOOK_SHARED_SECRET;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
        const webhookRes = await fetch(webhookUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(forwardedPayload),
            signal: controller.signal,
            cache: "no-store",
        });

        if (!webhookRes.ok) {
            const text = await webhookRes.text().catch(() => "");
            console.error("n8n webhook failed", webhookRes.status, text);
            return json(
                { message: "We couldn’t send your details right now. Please try again." },
                502
            );
        }

        return json({ ok: true });
    } catch (error) {
        console.error("mortgage lead route error", error);
        return json(
            { message: "We couldn’t send your details right now. Please try again." },
            500
        );
    } finally {
        clearTimeout(timeout);
    }
}