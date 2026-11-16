import { statusInfo } from "@/lib/admin/orders";

/** Small read-only status chip with the same soft colours as the status select. */
export default function StatusBadge({ status }: { status: string }) {
  const info = statusInfo(status);
  return (
    <span className={`inline-flex min-h-8 items-center rounded-full border px-3 text-sm font-bold ${info.badge}`}>
      {info.label}
    </span>
  );
}
