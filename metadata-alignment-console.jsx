import React, { useState, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  GitBranch,
  Layers,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Database,
  ChevronRight,
  Info,
  Target,
  XCircle,
  Hourglass,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Design tokens (Tailwind core palette only — teal/indigo/amber/rose) */
/* ------------------------------------------------------------------ */

const DEPT_STYLES = {
  blue: {
    chip: "bg-blue-50 text-blue-700 border-blue-200",
    card: "border-blue-200",
    dot: "bg-blue-500",
    bar: "bg-blue-500",
    text: "text-blue-700",
  },
  violet: {
    chip: "bg-violet-50 text-violet-700 border-violet-200",
    card: "border-violet-200",
    dot: "bg-violet-500",
    bar: "bg-violet-500",
    text: "text-violet-700",
  },
  rose: {
    chip: "bg-rose-50 text-rose-700 border-rose-200",
    card: "border-rose-200",
    dot: "bg-rose-500",
    bar: "bg-rose-500",
    text: "text-rose-700",
  },
};

/* ------------------------------------------------------------------ */
/* Mock governance data                                                */
/* ------------------------------------------------------------------ */

const TERM_TABS = [
  { key: "activeCustomer", label: "Active Customer" },
  { key: "conversionRate", label: "Conversion Rate" },
  { key: "enterpriseAccount", label: "Enterprise Account" },
];

const TERMS = {
  activeCustomer: {
    label: "Active Customer",
    status: "conflict",
    metric: "count",
    departments: [
      {
        name: "Product",
        color: "blue",
        logic:
          "Any user with \u22651 in-app login event in the trailing 30 days, regardless of billing state.",
        source: "product_analytics.user_events",
        sourceSystem: "Amplitude sync \u00b7 nightly",
        value: 842000,
        display: "842K",
      },
      {
        name: "Finance",
        color: "violet",
        logic:
          "Account holds a paid invoice in the trailing 90 days AND subscription status \u2260 churned.",
        source: "billing.subscriptions",
        sourceSystem: "NetSuite export \u00b7 daily",
        value: 511000,
        display: "511K",
      },
      {
        name: "Marketing",
        color: "rose",
        logic:
          "Contact opened or clicked any campaign email in the trailing 60 days \u2014 purchase not required.",
        source: "marketing.campaign_engagement",
        sourceSystem: "Marketo sync \u00b7 hourly",
        value: 1203000,
        display: "1.20M",
      },
    ],
    unified: {
      logic:
        "Account with a confirmed transaction (invoice or verified usage event) in the trailing 60 days AND crm.accounts.status = 'active'.",
      source: "crm.accounts.active_flag",
      sourceSystem: "Unified catalog \u00b7 Data Governance Council",
      value: 627000,
      display: "627K",
      state: "in_review",
      note: "Pending sign-off from Marketing \u2014 projected to cut their segment by 48%.",
    },
  },
  conversionRate: {
    label: "Conversion Rate",
    status: "conflict",
    metric: "percent",
    departments: [
      {
        name: "Marketing",
        color: "rose",
        logic:
          "MQL \u2192 Opportunity conversion, counted at lead-creation date regardless of eventual close.",
        source: "marketing.funnel.mql_conv",
        sourceSystem: "Marketo sync \u00b7 hourly",
        value: 18.4,
        display: "18.4%",
      },
      {
        name: "Sales Ops",
        color: "blue",
        logic:
          "SQL \u2192 Closed-Won conversion, counted at deal-close date and attributed to the closing quarter.",
        source: "sales.pipeline.sql_conv",
        sourceSystem: "Salesforce export \u00b7 daily",
        value: 7.1,
        display: "7.1%",
      },
    ],
    unified: {
      logic:
        "SQL \u2192 Closed-Won conversion, counted at deal-close date, cohorted to lead-creation quarter for trend comparability.",
      source: "sales.funnel.conv_rate_cataloged",
      sourceSystem: "Unified catalog \u00b7 Data Governance Council",
      value: 8.9,
      display: "8.9%",
      state: "in_review",
      note: "Awaiting Marketing sign-off \u2014 stage definitions still under review.",
    },
  },
  enterpriseAccount: {
    label: "Enterprise Account",
    status: "resolved",
    metric: "count",
    departments: [
      {
        name: "Sales",
        color: "blue",
        logic: "Historical: any closed deal with contract value > $50K ACV.",
        source: "sales.pipeline.deal_value",
        sourceSystem: "Salesforce export \u00b7 daily",
        value: 4300,
        display: "4.3K",
      },
      {
        name: "Customer Success",
        color: "violet",
        logic: "Historical: any account with a seat count above 200 licenses.",
        source: "product_analytics.seat_counts",
        sourceSystem: "Amplitude sync \u00b7 nightly",
        value: 2900,
        display: "2.9K",
      },
    ],
    unified: {
      logic:
        "Account with ACV > $50K OR seat count > 200, verified against crm.accounts.tier = 'enterprise'.",
      source: "crm.accounts.tier",
      sourceSystem: "Unified catalog \u00b7 Data Governance Council",
      value: 3650,
      display: "3.65K",
      state: "resolved",
      note: "Ratified Jun 12, 2026 \u2014 both teams now query the same tier field.",
    },
  },
};

const GLOSSARY_ROWS = [
  {
    term: "Churn Rate",
    field: "analytics.churn_events.churn_flag",
    status: "aligned",
    synced: "Aug 6, 2026 \u00b7 09:14",
  },
  {
    term: "Customer Lifetime Value",
    field: "finance.ltv_model.ltv_usd",
    status: "aligned",
    synced: "Aug 6, 2026 \u00b7 09:14",
  },
  {
    term: "Active Customer",
    field: "crm.accounts.active_flag",
    status: "conflict",
    synced: "Aug 5, 2026 \u00b7 22:41",
    detail: "3 competing definitions",
  },
  {
    term: "Enterprise Account",
    field: "crm.accounts.tier",
    status: "aligned",
    synced: "Aug 6, 2026 \u00b7 09:14",
  },
  {
    term: "Conversion Rate",
    field: "sales.funnel.conv_rate_cataloged",
    status: "conflict",
    synced: "Aug 4, 2026 \u00b7 16:03",
    detail: "2 competing definitions",
  },
  {
    term: "Qualified Lead",
    field: "sales.leads.mql_flag",
    status: "pending",
    synced: "Aug 3, 2026 \u00b7 11:20",
  },
  {
    term: "Net Revenue Retention",
    field: "finance.nrr_model.nrr_pct",
    status: "aligned",
    synced: "Aug 6, 2026 \u00b7 09:14",
  },
  {
    term: "Active Segment Size",
    field: "segmentation.core.active_segment_count",
    status: "aligned",
    synced: "Aug 6, 2026 \u00b7 09:14",
  },
];

const IMPACT_DATA = [
  { term: "Churn Rate", before: 52, after: 98 },
  { term: "Customer Lifetime Value", before: 61, after: 94 },
  { term: "Active Customer", before: 41, after: 90 },
  { term: "Enterprise Account", before: 67, after: 99 },
  { term: "Conversion Rate", before: 58, after: 82 },
];

/* ------------------------------------------------------------------ */
/* Small presentational helpers                                       */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }) {
  const map = {
    aligned: {
      label: "Aligned",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Icon: CheckCircle2,
    },
    conflict: {
      label: "Conflict detected",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      Icon: AlertTriangle,
    },
    pending: {
      label: "Pending review",
      cls: "bg-slate-100 text-slate-600 border-slate-200",
      Icon: Hourglass,
    },
  };
  const s = map[status];
  const Icon = s.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${s.cls}`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
      {s.label}
    </span>
  );
}

function TrustRing({ value, size = 84 }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#0f766e"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
      <text
        x="50%"
        y="50%"
        transform={`rotate(90 ${size / 2} ${size / 2})`}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-slate-900 font-mono"
        style={{ fontSize: 20, fontWeight: 700 }}
      >
        {value}
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */

export default function MetadataAlignmentConsole() {
  const [activeTerm, setActiveTerm] = useState("activeCustomer");
  const term = TERMS[activeTerm];

  const alignedCount = GLOSSARY_ROWS.filter((r) => r.status === "aligned").length;
  const conflictCount = GLOSSARY_ROWS.filter((r) => r.status === "conflict").length;
  const pendingCount = GLOSSARY_ROWS.filter((r) => r.status === "pending").length;
  const coveragePct = Math.round((alignedCount / GLOSSARY_ROWS.length) * 100);

  const maxDeptValue = useMemo(() => {
    const vals = [...term.departments.map((d) => d.value), term.unified.value];
    return Math.max(...vals);
  }, [term]);

  const aggTrust = Math.round(
    IMPACT_DATA.reduce((s, d) => s + d.after, 0) / IMPACT_DATA.length
  );
  const aggBaseline = Math.round(
    IMPACT_DATA.reduce((s, d) => s + d.before, 0) / IMPACT_DATA.length
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }
        .font-body { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
      `}</style>

      <div className="font-body">
        {/* ============================================================ */}
        {/* HEADER                                                        */}
        {/* ============================================================ */}
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-teal-700">
                  <Layers className="h-3.5 w-3.5" />
                  Data Governance &middot; Customer Segmentation
                </div>
                <h1 className="font-display mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
                  Metadata Alignment Console
                </h1>
                <p className="mt-2 max-w-xl text-sm text-slate-500">
                  Every segmentation metric traced from business definition to
                  technical source \u2014 so &ldquo;Active Customer&rdquo; means
                  the same thing in Product, Finance, and Marketing.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" strokeWidth={2.25} />
                  <div>
                    <div className="font-mono text-lg font-semibold leading-none text-emerald-700">
                      {alignedCount}
                    </div>
                    <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-emerald-600">
                      Resolved
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" strokeWidth={2.25} />
                  <div>
                    <div className="font-mono text-lg font-semibold leading-none text-amber-700">
                      {conflictCount}
                    </div>
                    <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-amber-600">
                      Conflicts
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Hourglass className="h-5 w-5 text-slate-500" strokeWidth={2.25} />
                  <div>
                    <div className="font-mono text-lg font-semibold leading-none text-slate-700">
                      {pendingCount}
                    </div>
                    <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      Pending
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5">
                  <TrustRing value={coveragePct} size={56} />
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-teal-700">
                      Glossary
                    </div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-teal-700">
                      Coverage
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-10 px-6 py-10 sm:px-10">
          {/* ============================================================ */}
          {/* DEFINITION COLLISION MODULE                                   */}
          {/* ============================================================ */}
          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                  <GitBranch className="h-3.5 w-3.5" />
                  Definition Collision
                </div>
                <h2 className="font-display mt-1 text-xl font-bold text-slate-900">
                  Where one term became three
                </h2>
              </div>
              <div className="hidden text-right text-xs text-slate-400 sm:block">
                Select a term to trace its drift across departments
              </div>
            </div>

            {/* Term tabs */}
            <div className="mb-6 flex flex-wrap gap-2">
              {TERM_TABS.map((t) => {
                const isActive = t.key === activeTerm;
                const s = TERMS[t.key].status;
                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveTerm(t.key)}
                    className={`group flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {t.label}
                    {s === "conflict" ? (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isActive ? "bg-amber-400" : "bg-amber-500"
                        }`}
                      />
                    ) : (
                      <CheckCircle2
                        className={`h-3.5 w-3.5 ${
                          isActive ? "text-emerald-400" : "text-emerald-500"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              {/* Central term node */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-900 px-5 py-3 text-white shadow-sm">
                  <Target className="h-4 w-4 text-teal-300" />
                  <span className="font-display text-base font-semibold">
                    &ldquo;{term.label}&rdquo;
                  </span>
                </div>
              </div>

              {/* Connector lines */}
              <svg
                viewBox="0 0 3 1"
                preserveAspectRatio="none"
                className="mx-auto mt-3 h-10 w-full max-w-3xl text-slate-300"
              >
                <line x1="1.5" y1="0" x2="0.3" y2="1" stroke="currentColor" strokeWidth="0.02" />
                <line x1="1.5" y1="0" x2="1.5" y2="1" stroke="currentColor" strokeWidth="0.02" />
                <line x1="1.5" y1="0" x2="2.7" y2="1" stroke="currentColor" strokeWidth="0.02" />
              </svg>

              {/* Department cards */}
              <div
                className={`grid gap-4 ${
                  term.departments.length === 2
                    ? "sm:grid-cols-2"
                    : "sm:grid-cols-3"
                }`}
              >
                {term.departments.map((dept) => {
                  const st = DEPT_STYLES[dept.color];
                  const pct = Math.max(6, (dept.value / maxDeptValue) * 100);
                  return (
                    <div
                      key={dept.name}
                      className={`rounded-xl border p-4 ${st.card} bg-white`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${st.chip}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          {dept.name}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-snug text-slate-600">
                        {dept.logic}
                      </p>

                      <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2">
                        <Database className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <div className="min-w-0">
                          <div className="truncate font-mono text-[11px] text-slate-700">
                            {dept.source}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {dept.sourceSystem}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            {term.metric === "percent" ? "Reported rate" : "Segment size"}
                          </span>
                          <span className={`font-mono text-sm font-semibold ${st.text}`}>
                            {dept.display}
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${st.bar}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Unified resolution banner */}
              <div className="mt-6 flex items-start gap-2 text-xs text-slate-400">
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Reconciled through the Data Governance Council
              </div>
              <div
                className={`mt-2 rounded-xl border p-4 sm:p-5 ${
                  term.unified.state === "resolved"
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-teal-200 bg-teal-50"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <ShieldCheck
                      className={`mt-0.5 h-5 w-5 shrink-0 ${
                        term.unified.state === "resolved"
                          ? "text-emerald-600"
                          : "text-teal-600"
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-semibold text-slate-900">
                          Catalog definition
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            term.unified.state === "resolved"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-teal-100 text-teal-700"
                          }`}
                        >
                          {term.unified.state === "resolved"
                            ? "Ratified"
                            : "In review"}
                        </span>
                      </div>
                      <p className="mt-1 max-w-xl text-sm text-slate-600">
                        {term.unified.logic}
                      </p>
                      <div className="mt-2 flex items-center gap-2 font-mono text-[11px] text-slate-500">
                        <Database className="h-3 w-3" />
                        {term.unified.source}
                        <span className="text-slate-300">&middot;</span>
                        {term.unified.sourceSystem}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:pl-4">
                    <div className="text-right">
                      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Unified value
                      </div>
                      <div className="font-mono text-2xl font-bold text-slate-900">
                        {term.unified.display}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-1.5 border-t border-black/5 pt-3 text-xs text-slate-500">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {term.unified.note}
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* GLOSSARY MAPPING PROGRESS TRACKER                             */}
          {/* ============================================================ */}
          <section>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Glossary Mapping
                </div>
                <h2 className="font-display mt-1 text-xl font-bold text-slate-900">
                  Progress toward one shared source of truth
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-teal-600"
                    style={{ width: `${coveragePct}%` }}
                  />
                </div>
                <span className="font-mono">{coveragePct}% aligned</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-semibold">Business term</th>
                    <th className="px-5 py-3 font-semibold">Technical source field</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Last synced</th>
                  </tr>
                </thead>
                <tbody>
                  {GLOSSARY_ROWS.map((row, i) => (
                    <tr
                      key={row.term}
                      className={i !== GLOSSARY_ROWS.length - 1 ? "border-b border-slate-100" : ""}
                    >
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {row.term}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-slate-600">
                          {row.field}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={row.status} />
                          {row.detail && (
                            <span className="text-[11px] text-slate-400">
                              {row.detail}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          {row.synced}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ============================================================ */}
          {/* IMPACT ANALYSIS                                               */}
          {/* ============================================================ */}
          <section>
            <div className="mb-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                <TrendingUp className="h-3.5 w-3.5" />
                Impact Analysis
              </div>
              <h2 className="font-display mt-1 text-xl font-bold text-slate-900">
                Trust score: fragmented vs. unified in catalog
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Trust score reflects the share of downstream segmentation
                queries that resolve to a single, catalog-approved value for
                each term rather than a department-specific one.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Bars */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
                <div className="mb-4 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-400" />
                    Fragmented
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-teal-600" />
                    Unified in catalog
                  </span>
                </div>
                <div className="space-y-5">
                  {IMPACT_DATA.map((d) => (
                    <div key={d.term}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{d.term}</span>
                        <span className="font-mono text-xs text-slate-400">
                          {d.before}
                          <ArrowRight className="mx-1 inline h-3 w-3" />
                          <span className="font-semibold text-teal-700">{d.after}</span>
                        </span>
                      </div>
                      <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-rose-300"
                          style={{ width: `${d.before}%` }}
                        />
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-teal-600"
                          style={{ width: `${d.after}%`, opacity: 0.85 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aggregate summary */}
              <div className="flex flex-col justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-6">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Aggregate dashboard trust score
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <TrustRing value={aggTrust} size={90} />
                    <div>
                      <div className="font-mono text-3xl font-bold text-slate-900">
                        {aggTrust}
                        <span className="text-base font-normal text-slate-400">/100</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <TrendingUp className="h-3.5 w-3.5" />
                        +{aggTrust - aggBaseline} pts vs. baseline
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
                  <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-slate-600">
                    <XCircle className="h-3.5 w-3.5 text-rose-400" />
                    Baseline: {aggBaseline}/100
                  </div>
                  Measured before glossary mapping, when each department
                  queried its own source field for the same business term.
                </div>
              </div>
            </div>
          </section>

          <footer className="flex flex-col gap-1 border-t border-slate-200 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>Owned by the Data Governance Council &middot; Customer Segmentation workstream</span>
            <span className="font-mono">Next audit: Aug 20, 2026</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
