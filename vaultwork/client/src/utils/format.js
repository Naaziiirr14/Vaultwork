export const inr = (n) =>
  "₹" + new Intl.NumberFormat("en-IN").format(Math.round(Number(n) || 0));

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

export const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "";

export const STATUS_LABEL = {
  pending: "Awaiting funds",
  funded: "In escrow",
  submitted: "Work submitted",
  disputed: "Disputed",
  released: "Released",
  refunded: "Refunded",
  open: "Open",
  in_progress: "In progress",
  completed: "Completed",
  resolved: "Resolved",
};
