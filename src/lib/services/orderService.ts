/**
 * Mock order/backend service. Replace the bodies with real API calls later —
 * the UI only depends on these function signatures.
 */
import type { Order, OrderStatus } from "@/store/appStore";
import { SERVICEABLE_PIN_PREFIXES } from "@/data/pricing";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function generateOrderId() {
  const d = new Date();
  const stamp = `${d.getFullYear().toString().slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `CV-${stamp}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export async function checkPincode(pin: string): Promise<{ ok: boolean; message: string }> {
  await wait(250);
  if (!/^\d{6}$/.test(pin)) return { ok: false, message: "Enter a valid 6-digit PIN code" };
  const ok = SERVICEABLE_PIN_PREFIXES.some((p) => pin.startsWith(p));
  return ok
    ? { ok: true, message: "Delivery available · same-day for orders before 4 PM" }
    : { ok: false, message: "Sorry, we don't deliver here yet — choose store pickup" };
}

export async function submitOrder(order: Order): Promise<{ ok: true; id: string }> {
  // simulate payment gateway + order API latency
  await wait(1400);
  return { ok: true, id: order.id };
}

export const STATUS_FLOW: { id: OrderStatus; label: string; hint: string }[] = [
  { id: "placed", label: "Order placed", hint: "We've received your order" },
  { id: "confirmed", label: "Confirmed", hint: "Our pastry chef reviewed your design" },
  { id: "baking", label: "Baking", hint: "Sponges are in the oven" },
  { id: "decorating", label: "Decorating", hint: "Hand-finishing every detail" },
  { id: "out-for-delivery", label: "Out for delivery", hint: "Riding carefully to you" },
  { id: "delivered", label: "Delivered", hint: "Enjoy your celebration!" },
];

/** derive a simulated status from elapsed time since order (1 step / 2 minutes) */
export function simulatedStatus(order: Pick<Order, "createdAt">): number {
  const mins = (Date.now() - order.createdAt) / 60000;
  return Math.min(STATUS_FLOW.length - 1, Math.floor(mins / 2));
}
