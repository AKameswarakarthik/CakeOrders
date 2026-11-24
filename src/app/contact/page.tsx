"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Clock, Loader2, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "@/store/appStore";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.string().trim().email("Enter a valid email"),
  topic: z.enum(["order", "custom", "corporate", "feedback", "other"]),
  message: z.string().trim().min(10, "Tell us a little more (10+ characters)").max(1000),
});
type V = z.infer<typeof schema>;

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<V>({ resolver: zodResolver(schema), defaultValues: { topic: "order" } });
  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 900)); // mock API
    setSent(true);
    reset();
    toast({ title: "Message sent (simulated)", description: "We usually reply within 2 hours.", tone: "success" });
  };
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-5xl">Contact us</h1>
      <p className="mt-3 text-muted">Questions about a design, bulk orders or a delivery? We&apos;re here 9 AM – midnight.</p>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={handleSubmit(onSubmit)} className="glass rounded-3xl p-6" noValidate>
          {sent && <p className="mb-4 flex items-center gap-2 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-500"><CheckCircle2 className="h-4 w-4" /> Thanks! Your message has been received.</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="c-name">Name</label>
              <input id="c-name" className="field mt-1.5" {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label" htmlFor="c-email">Email</label>
              <input id="c-email" type="email" className="field mt-1.5" {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="c-topic">Topic</label>
              <select id="c-topic" className="field mt-1.5" {...register("topic")}>
                <option value="order">An existing order</option>
                <option value="custom">Custom design help</option>
                <option value="corporate">Corporate / bulk orders</option>
                <option value="feedback">Feedback</option>
                <option value="other">Something else</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="c-msg">Message</label>
              <textarea id="c-msg" rows={5} className="field mt-1.5" {...register("message")} />
              {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message.message}</p>}
            </div>
          </div>
          <button className="btn btn-primary mt-5 px-6 py-3" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Send message
          </button>
        </form>
        <aside className="space-y-4">
          {[
            { icon: Phone, t: "Call", d: "+91 90000 12345" },
            { icon: Mail, t: "Email", d: "hello@cakeverse.example" },
            { icon: MapPin, t: "Flagship patisserie", d: "Road No. 36, Jubilee Hills, Hyderabad 500033" },
            { icon: Clock, t: "Hours", d: "Every day · 9:00 AM – 12:00 AM" },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="glass flex gap-4 rounded-3xl p-5">
              <Icon className="h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="font-semibold">{t}</p>
                <p className="text-sm text-muted">{d}</p>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
