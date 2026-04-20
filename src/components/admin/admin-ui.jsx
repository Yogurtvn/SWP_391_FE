import { cn } from "@/utils/cn";

export const adminStyles = {
  page: "min-h-screen bg-[#fafbfc] px-5 py-6 md:px-8 md:py-8",
  container: "mx-auto w-full max-w-[1540px] space-y-6",
  pageHeader: "flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between",
  pageTitle: "text-[2.25rem] font-bold tracking-tight text-slate-950",
  pageActions: "flex flex-wrap items-center gap-3",
  card: "rounded-[1.6rem] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
  cardBody: "p-5 md:p-6",
  sectionTitle: "text-[1.15rem] font-bold text-slate-950",
  sectionSubtitle: "text-sm font-medium text-slate-500",
  toolbarGrid: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
  input:
    "h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10",
  textarea:
    "min-h-32 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10",
  checkboxRow:
    "flex min-h-14 items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 text-base font-semibold text-slate-900 shadow-sm",
  primaryButton:
    "inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60",
  secondaryButton:
    "inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
  smallButton:
    "inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
  smallDangerButton:
    "inline-flex items-center justify-center rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50",
  tableWrapper:
    "overflow-x-auto rounded-[1.6rem] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
  table: "min-w-full divide-y divide-slate-200",
  tableHead: "bg-white",
  th: "px-5 py-4 text-left text-sm font-bold uppercase tracking-[0.02em] text-slate-700",
  td: "px-5 py-4 align-middle text-base text-slate-700",
  emptyState: "px-5 py-8 text-center text-base text-slate-500",
  prePanel: "overflow-auto rounded-2xl bg-slate-50 p-4 text-sm text-slate-800",
  error:
    "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700",
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
