#!/usr/bin/env bash
set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────
FORMEDIBLE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="/tmp/formedible-integration-test-$(date +%s)"
PROJECT_NAME="formedible-test-app"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

# ── Step 1: Build formedible locally ────────────────────────────────
log "Building formedible package..."
cd "$FORMEDIBLE_ROOT"
npm run build:pkg

# ── Step 2: Scaffold new app ────────────────────────────────────────
log "Scaffolding new Better-T-Stack app..."
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

pnpm create better-t-stack@latest "$PROJECT_NAME" \
  --frontend tanstack-start \
  --backend none \
  --runtime none \
  --api none \
  --auth none \
  --payments none \
  --database none \
  --orm none \
  --db-setup none \
  --package-manager pnpm \
  --git \
  --web-deploy none \
  --server-deploy none \
  --install \
  --addons turborepo \
  --examples none

cd "$TEST_DIR/$PROJECT_NAME"

# ── Step 3: Add formedible via local registry ───────────────────────
log "Adding formedible from local registry..."
cd apps/web

REGISTRY_PATH="$FORMEDIBLE_ROOT/packages/formedible/public/r/use-formedible.json"
pnpm dlx shadcn@latest add "$REGISTRY_PATH" --yes --overwrite

cd "$TEST_DIR/$PROJECT_NAME"

# ── Step 4: Generate form pages ─────────────────────────────────────
log "Creating test form pages..."

write_file() {
  mkdir -p "$(dirname "$1")"
  cat > "$1"
}

# --- Contact form ---
write_file "apps/web/src/routes/contact.tsx" << 'FORMEOF'
import { createFileRoute } from "@tanstack/react-router";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  subject: z.enum(["general", "support", "sales"]),
  message: z.string().min(10, "Message must be at least 10 characters"),
  urgent: z.boolean().default(false),
});

function ContactPage() {
  const form = useFormedible({
    schema: contactSchema,
    fields: [
      { name: "name", type: "text", label: "Full Name", placeholder: "John Doe" },
      { name: "email", type: "email", label: "Email", placeholder: "john@example.com" },
      {
        name: "subject",
        type: "combobox",
        label: "Subject",
        options: [
          { value: "general", label: "General Inquiry" },
          { value: "support", label: "Technical Support" },
          { value: "sales", label: "Sales Question" },
        ],
        comboboxConfig: { searchable: true, placeholder: "Select subject..." },
      },
      { name: "message", type: "textarea", label: "Message", placeholder: "How can we help?" },
      { name: "urgent", type: "checkbox", label: "This is urgent" },
    ],
    submitLabel: "Send Message",
    formOptions: {
      defaultValues: { name: "", email: "", subject: "general" as const, message: "", urgent: false },
      onSubmit: async ({ value }) => { console.log("Submitted:", value); },
    },
  });

  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Contact Us</h1>
      <form.Form className="space-y-4" />
    </div>
  );
}

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});
FORMEOF

# --- Registration form (multi-page) ---
write_file "apps/web/src/routes/register.tsx" << 'FORMEOF'
import { createFileRoute } from "@tanstack/react-router";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";

const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  birthDate: z.date(),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Phone number required"),
  address: z.string().min(5, "Address required"),
  newsletter: z.boolean(),
  notifications: z.boolean(),
  plan: z.enum(["basic", "pro", "enterprise"]),
});

function RegisterPage() {
  const form = useFormedible({
    schema: registrationSchema,
    fields: [
      { name: "firstName", type: "text", label: "First Name", page: 1 },
      { name: "lastName", type: "text", label: "Last Name", page: 1 },
      { name: "birthDate", type: "date", label: "Birth Date", page: 1 },
      { name: "email", type: "email", label: "Email", page: 2 },
      { name: "phone", type: "phone", label: "Phone", page: 2 },
      { name: "address", type: "textarea", label: "Address", page: 2 },
      { name: "newsletter", type: "switch", label: "Subscribe to newsletter", page: 3 },
      { name: "notifications", type: "switch", label: "Enable notifications", page: 3 },
      {
        name: "plan",
        type: "radio",
        label: "Choose Plan",
        page: 3,
        options: [
          { value: "basic", label: "Basic - Free" },
          { value: "pro", label: "Pro - $9/month" },
          { value: "enterprise", label: "Enterprise - $29/month" },
        ],
      },
    ],
    pages: [
      { page: 1, title: "Personal Information", description: "Tell us about yourself" },
      { page: 2, title: "Contact Details", description: "How can we reach you?" },
      { page: 3, title: "Preferences", description: "Customize your experience" },
    ],
    progress: { showSteps: true, showPercentage: true },
    formOptions: {
      defaultValues: {
        firstName: "", lastName: "", birthDate: new Date(), email: "",
        phone: "", address: "", newsletter: true, notifications: true, plan: "basic" as const,
      },
      onSubmit: async ({ value }) => { console.log("Registered:", value); },
    },
  });

  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Registration</h1>
      <form.Form className="space-y-4" />
    </div>
  );
}

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});
FORMEOF

# --- Survey form (conditional fields) ---
write_file "apps/web/src/routes/survey.tsx" << 'FORMEOF'
import { createFileRoute } from "@tanstack/react-router";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";

const surveySchema = z.object({
  satisfaction: z.number().min(1).max(5),
  recommend: z.enum(["yes", "maybe", "no"]),
  improvements: z.string().optional(),
  features: z.array(z.string()),
  country: z.string().optional(),
});

function SurveyPage() {
  const form = useFormedible({
    schema: surveySchema,
    fields: [
      {
        name: "satisfaction", type: "rating", label: "How satisfied are you?",
        ratingConfig: { max: 5, allowHalf: false, showValue: true },
      },
      {
        name: "recommend", type: "radio", label: "Would you recommend us?",
        options: [
          { value: "yes", label: "Yes, definitely" },
          { value: "maybe", label: "Maybe" },
          { value: "no", label: "No" },
        ],
      },
      {
        name: "improvements", type: "textarea", label: "What could we improve?",
        conditional: (values: any) => values.satisfaction < 4,
      },
      {
        name: "features", type: "multiSelect", label: "Which features do you use?",
        options: [
          { value: "forms", label: "Form Builder" },
          { value: "validation", label: "Validation" },
          { value: "analytics", label: "Analytics" },
        ],
        multiSelectConfig: { maxSelections: 3 },
      },
      {
        name: "country", type: "select", label: "Country",
        options: [
          { value: "us", label: "United States" },
          { value: "ca", label: "Canada" },
          { value: "uk", label: "United Kingdom" },
        ],
      },
    ],
    formOptions: {
      defaultValues: { satisfaction: 5, recommend: "yes" as const, improvements: "", features: [], country: "" },
      onSubmit: async ({ value }) => { console.log("Survey:", value); },
    },
  });

  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Survey</h1>
      <form.Form className="space-y-4" />
    </div>
  );
}

export const Route = createFileRoute("/survey")({
  component: SurveyPage,
});
FORMEOF

# --- Checkout form (multi-page + conditional) ---
write_file "apps/web/src/routes/checkout.tsx" << 'FORMEOF'
import { createFileRoute } from "@tanstack/react-router";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";

const checkoutSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  address: z.string().min(5),
  city: z.string().min(1),
  zipCode: z.string().min(5),
  paymentMethod: z.enum(["card", "paypal", "apple_pay"]),
  cardNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  shippingMethod: z.enum(["standard", "express", "overnight"]),
  giftMessage: z.string().optional(),
});

function CheckoutPage() {
  const form = useFormedible({
    schema: checkoutSchema,
    fields: [
      { name: "firstName", type: "text", label: "First Name", page: 1 },
      { name: "lastName", type: "text", label: "Last Name", page: 1 },
      { name: "email", type: "email", label: "Email", page: 1 },
      { name: "address", type: "text", label: "Address", page: 1 },
      { name: "city", type: "text", label: "City", page: 1 },
      { name: "zipCode", type: "text", label: "ZIP Code", page: 1 },
      {
        name: "paymentMethod", type: "radio", label: "Payment Method", page: 2,
        options: [
          { value: "card", label: "Credit/Debit Card" },
          { value: "paypal", label: "PayPal" },
          { value: "apple_pay", label: "Apple Pay" },
        ],
      },
      {
        name: "cardNumber", type: "text", label: "Card Number", page: 2,
        conditional: (values: any) => values.paymentMethod === "card",
        placeholder: "1234 5678 9012 3456",
      },
      {
        name: "expiryDate", type: "text", label: "Expiry Date", page: 2,
        conditional: (values: any) => values.paymentMethod === "card",
        placeholder: "MM/YY",
      },
      {
        name: "shippingMethod", type: "radio", label: "Shipping Method", page: 3,
        options: [
          { value: "standard", label: "Standard (5-7 days) - Free" },
          { value: "express", label: "Express (2-3 days) - $9.99" },
          { value: "overnight", label: "Overnight - $24.99" },
        ],
      },
      { name: "giftMessage", type: "textarea", label: "Gift Message (Optional)", page: 3 },
    ],
    pages: [
      { page: 1, title: "Shipping Address", description: "Where should we send your order?" },
      { page: 2, title: "Payment", description: "How would you like to pay?" },
      { page: 3, title: "Review & Submit", description: "Review your order" },
    ],
    progress: { showSteps: true },
    formOptions: {
      defaultValues: {
        firstName: "", lastName: "", email: "", address: "", city: "", zipCode: "",
        paymentMethod: "card" as const, cardNumber: "", expiryDate: "",
        shippingMethod: "standard" as const, giftMessage: "",
      },
      onSubmit: async ({ value }) => { console.log("Order:", value); },
    },
  });

  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <form.Form className="space-y-4" />
    </div>
  );
}

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});
FORMEOF

# --- Home page ---
write_file "apps/web/src/routes/index.tsx" << 'FORMEOF'
import { createFileRoute } from "@tanstack/react-router";

function HomePage() {
  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Formedible Integration Test</h1>
      <nav className="space-y-2">
        <a href="/contact" className="block text-blue-600 hover:underline">Contact Form</a>
        <a href="/register" className="block text-blue-600 hover:underline">Registration Form</a>
        <a href="/survey" className="block text-blue-600 hover:underline">Survey Form</a>
        <a href="/checkout" className="block text-blue-600 hover:underline">Checkout Form</a>
      </nav>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: HomePage,
});
FORMEOF

# ── Step 4.5: Fix missing @types/node in packages/ui ─────────────────
log "Installing missing @types/node in packages/ui..."
cd packages/ui
pnpm add -D @types/node
cd "$TEST_DIR/$PROJECT_NAME"

# ── Step 4.6: Fix tsconfig paths for formedible imports ──────────────
log "Adding @/components/ui path alias to apps/web tsconfig..."
WEB_TSCONFIG="apps/web/tsconfig.json"
if [ -f "$WEB_TSCONFIG" ]; then
  sed -i 's|"@formedible-test-app/ui/\*": \["../../packages/ui/src/\*"\]|"@formedible-test-app/ui/*": ["../../packages/ui/src/*"],\n      "@/components/ui/*": ["../../packages/ui/src/components/*"]|' "$WEB_TSCONFIG"
fi

# ── Step 4.7: Install missing deps in apps/web ───────────────────────
log "Installing missing dependencies in apps/web..."
cd apps/web
pnpm add @tanstack/react-form @tanstack/form-core @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities date-fns
cd "$TEST_DIR/$PROJECT_NAME"

# ── Step 4.8: Generate route tree via build ──────────────────────────
log "Building apps/web to generate route tree..."
cd apps/web
pnpm run build 2>/dev/null || true
cd "$TEST_DIR/$PROJECT_NAME"

# ── Step 5: Ensure scripts exist in ALL packages ────────────────────
log "Injecting check-types scripts where missing..."

# Find every package.json that has a "scripts" block but no "check-types"
find . -name "package.json" -not -path "*/node_modules/*" | while read -r pkg; do
  if jq -e '.scripts' "$pkg" > /dev/null 2>&1; then
    if ! jq -e '.scripts["check-types"]' "$pkg" > /dev/null 2>&1; then
      warn "Adding check-types to $pkg"
      jq '.scripts["check-types"] = "tsc --noEmit"' "$pkg" > "${pkg}.tmp" && mv "${pkg}.tmp" "$pkg"
    fi
  fi
done

# Ensure root has turbo-powered scripts
ROOT_PKG="package.json"
if ! jq -e '.scripts["check-types"]' "$ROOT_PKG" > /dev/null 2>&1; then
  warn "Adding check-types (turbo) to root package.json"
  jq '.scripts["check-types"] = "turbo check-types"' "$ROOT_PKG" > "${ROOT_PKG}.tmp" && mv "${ROOT_PKG}.tmp" "$ROOT_PKG"
fi
if ! jq -e '.scripts["build"]' "$ROOT_PKG" > /dev/null 2>&1; then
  warn "Adding build (turbo) to root package.json"
  jq '.scripts["build"] = "turbo build"' "$ROOT_PKG" > "${ROOT_PKG}.tmp" && mv "${ROOT_PKG}.tmp" "$ROOT_PKG"
fi

# Ensure turbo.json has the tasks
TURBO="turbo.json"
if [ -f "$TURBO" ]; then
  if ! jq -e '.tasks["check-types"]' "$TURBO" > /dev/null 2>&1; then
    warn "Adding check-types task to turbo.json"
    jq '.tasks["check-types"] = { "dependsOn": ["^build"] }' "$TURBO" > "${TURBO}.tmp" && mv "${TURBO}.tmp" "$TURBO"
  fi
fi

# ── Step 6: Verify — FULL REPO ──────────────────────────────────────
log "Running type check on entire repo..."
if pnpm run check-types; then
  log "Type check passed!"
else
  fail "Type check FAILED!"
fi

log "Running build on entire repo..."
if pnpm run build; then
  log "Build passed!"
else
  fail "Build FAILED!"
fi

# ── Done ────────────────────────────────────────────────────────────
log "Integration test completed successfully!"
log "Test project at: $TEST_DIR/$PROJECT_NAME"
echo ""
echo "To clean up: rm -rf $TEST_DIR"
