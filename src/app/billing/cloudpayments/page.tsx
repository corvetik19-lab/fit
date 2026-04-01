import { AppShell } from "@/components/app-shell";
import { CloudpaymentsCheckout } from "@/components/cloudpayments-checkout";
import { requireReadyViewer } from "@/lib/viewer";

export default async function CloudpaymentsBillingPage() {
  await requireReadyViewer();

  return (
    <AppShell
      compactHeader
      eyebrow="Оплата"
      hideAssistantWidget
      title="CloudPayments"
    >
      <div className="mx-auto w-full max-w-5xl py-4 sm:py-6">
        <CloudpaymentsCheckout />
      </div>
    </AppShell>
  );
}
