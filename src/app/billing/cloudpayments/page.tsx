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
      <div className="mx-auto flex w-full max-w-5xl items-start justify-center py-4 sm:py-6">
        <CloudpaymentsCheckout />
      </div>
    </AppShell>
  );
}
