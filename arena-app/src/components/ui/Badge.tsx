type ContestStatus = "DRAFT" | "OPEN" | "LOCKED" | "RUNNING" | "RESOLVED";

interface BadgeProps {
  status?: ContestStatus;
  teal?: boolean;
  warning?: boolean;
  children?: React.ReactNode;
}

const STATUS_CLASS: Record<ContestStatus, string> = {
  DRAFT: "badge-draft",
  OPEN: "badge-open",
  LOCKED: "badge-locked",
  RUNNING: "badge-running",
  RESOLVED: "badge-resolved",
};

export function Badge({ status, teal, warning, children }: BadgeProps) {
  let cls = "badge";
  if (teal) {
    cls = "badge-resolved";
  } else if (warning) {
    cls = "badge-locked";
  } else if (status) {
    cls = STATUS_CLASS[status] ?? "badge-draft";
  } else {
    cls = "badge-draft";
  }

  return <span className={cls}>{children ?? status}</span>;
}
