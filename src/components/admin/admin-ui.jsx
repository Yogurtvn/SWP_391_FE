import { cn } from "@/utils/cn";

export const adminStyles = {
  page: "min-h-screen bg-[#fffaf2] px-5 py-6 md:px-8 md:py-8",
  container: "mx-auto w-full max-w-[1540px] space-y-6",
  pageHeader: "flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between",
  pageTitle: "text-[2.25rem] font-bold tracking-tight text-[#11284b]",
  pageActions: "flex flex-wrap items-center gap-3",
  card: "rounded-[1.8rem] border border-orange-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)]",
  cardBody: "p-5 md:p-6",
  sectionTitle: "text-[1.15rem] font-bold text-[#11284b]",
  sectionSubtitle: "text-sm font-medium text-slate-500",
  toolbarGrid: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
  input:
    "h-14 w-full rounded-[1.25rem] border border-slate-300 bg-white px-4 text-base text-slate-900 shadow-[0_6px_16px_rgba(15,23,42,0.05)] transition placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-100",
  textarea:
    "min-h-32 w-full rounded-[1.25rem] border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-[0_6px_16px_rgba(15,23,42,0.05)] transition placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-100",
  checkboxRow:
    "flex min-h-14 items-center gap-3 rounded-[1.25rem] border border-slate-300 bg-white px-4 text-base font-semibold text-slate-900 shadow-[0_6px_16px_rgba(15,23,42,0.05)]",
  primaryButton:
    "inline-flex items-center justify-center rounded-[1.2rem] bg-[#172033] px-5 py-3 text-base font-bold text-white shadow-[0_12px_24px_rgba(23,32,51,0.18)] transition hover:bg-[#0f172a] disabled:cursor-not-allowed disabled:opacity-60",
  secondaryButton:
    "inline-flex items-center justify-center rounded-[1.2rem] border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-[#11284b] shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50",
  smallButton:
    "inline-flex items-center justify-center rounded-[1rem] border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#11284b] shadow-[0_6px_12px_rgba(15,23,42,0.06)] transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50",
  smallDangerButton:
    "inline-flex items-center justify-center rounded-[1rem] border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-[0_6px_12px_rgba(248,113,113,0.08)] transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50",
  tableWrapper:
    "overflow-x-auto rounded-[1.8rem] border border-orange-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)]",
  table: "min-w-full divide-y divide-slate-200",
  tableHead: "bg-white",
  th: "px-5 py-5 text-left text-sm font-bold uppercase tracking-[0.02em] text-[#324b72]",
  td: "px-5 py-5 align-middle text-base text-slate-700",
  emptyState: "px-5 py-8 text-center text-base text-slate-500",
  prePanel: "overflow-auto rounded-[1.4rem] border border-orange-100 bg-[#fff8ef] p-4 text-sm text-slate-800",
  error:
    "rounded-[1.3rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-[0_8px_18px_rgba(248,113,113,0.08)]",
};

export function AdminPageShell({ title, actions, children, className }) {
  return (
    <div className={cn(adminStyles.page, className)}>
      <div className={adminStyles.container}>
        <div className={adminStyles.pageHeader}>
          <h1 className={adminStyles.pageTitle}>{title}</h1>
          {actions ? <div className={adminStyles.pageActions}>{actions}</div> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

export function AdminSection({ title, subtitle, actions, children, className, bodyClassName }) {
  return (
    <section className={cn(adminStyles.card, className)}>
      <div className={cn(adminStyles.cardBody, bodyClassName)}>
        {title || subtitle || actions ? (
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              {title ? <h2 className={adminStyles.sectionTitle}>{title}</h2> : null}
              {subtitle ? <p className={adminStyles.sectionSubtitle}>{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}

export function AdminErrorBanner({ message }) {
  if (!message) {
    return null;
  }

  return <p className={adminStyles.error}>{message}</p>;
}
