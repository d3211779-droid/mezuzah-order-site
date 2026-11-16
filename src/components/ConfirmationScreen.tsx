import { useCatalog } from "@/lib/catalog/context";
import type { OrderValues } from "@/lib/validation";
import SelectedModelPreview from "./SelectedModelPreview";
import OrderSummary from "./OrderSummary";

type Props = {
  order: OrderValues;
  orderNumber: string;
  onReset: () => void;
};

export default function ConfirmationScreen({ order, orderNumber, onReset }: Props) {
  const firstName = order.fullName.trim().split(/\s+/)[0];
  const { confirmationMessage } = useCatalog().settings;

  return (
    <section
      id="confirmation"
      tabIndex={-1}
      aria-labelledby="confirmation-title"
      className="mx-auto max-w-xl px-4 pb-16 outline-none"
    >
      <div className="rounded-3xl border border-line bg-white p-6 text-center shadow-sm md:p-8">
        <div
          aria-hidden="true"
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold-soft text-3xl text-gold-deep"
        >
          ✓
        </div>
        <h2 id="confirmation-title" className="text-2xl font-bold md:text-3xl">
          ההזמנה התקבלה, {firstName}!
        </h2>
        <p className="mt-3 text-lg">
          מספר הזמנה: <strong dir="ltr">{orderNumber}</strong>
        </p>
        <p className="mt-2 whitespace-pre-line text-brown-soft">{confirmationMessage}</p>

        <div className="my-6">
          <SelectedModelPreview values={order} />
        </div>

        <div className="rounded-2xl bg-brown p-5 text-right text-white">
          <p className="mb-3 text-sm text-[#d9c39a]">סיכום ההזמנה</p>
          <OrderSummary values={order} />
        </div>

        <button
          type="button"
          onClick={onReset}
          className="mt-6 min-h-12 w-full rounded-2xl border-2 border-gold px-6 font-semibold text-gold-deep transition hover:bg-[#fbf6ed] sm:w-auto"
        >
          הזמנה חדשה
        </button>
      </div>
    </section>
  );
}
