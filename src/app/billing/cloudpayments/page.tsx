import { AppShell, toAppShellViewer } from "@/components/app-shell";
import { CloudpaymentsCheckout } from "@/components/cloudpayments-checkout";
import { requireReadyViewer } from "@/lib/viewer";

export default async function CloudpaymentsBillingPage() {
  const viewer = await requireReadyViewer();

  return (
    <AppShell
      compactHeader
      eyebrow="Оплата"
      hideAssistantWidget
      title="CloudPayments"
      viewer={toAppShellViewer(viewer)}
    >
      <div className="mx-auto flex w-full max-w-2xl items-start justify-center py-1 sm:py-4">
        <CloudpaymentsCheckout />
      </div>
    </AppShell>
  );
}
