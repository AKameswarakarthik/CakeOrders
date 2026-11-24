"use client";
import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { CakeBuilder } from "@/components/builder/CakeBuilder";
import { restoreDraft, useCakeStore } from "@/store/cakeStore";
import { getTemplate } from "@/data/templates";
import { decodeDesign } from "@/lib/services/share";
import { toast, useCart, useSaved, useUI } from "@/store/appStore";
import { createDefaultConfig } from "@/lib/cake/defaults";
import { OCCASIONS } from "@/data/occasions";
import type { OccasionId } from "@/types/cake";
import { uid } from "@/lib/utils";

function StudioLoader() {
  const params = useSearchParams();
  const hydrated = useUI((s) => s.hydrated);
  const done = useRef<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    const key = params.toString();
    if (done.current === key) return;
    done.current = key;
    const st = useCakeStore.getState();
    const template = params.get("template");
    const design = params.get("design");
    const saved = params.get("saved");
    const cart = params.get("cart");
    const occasion = params.get("occasion") as OccasionId | null;

    if (template) {
      const t = getTemplate(template);
      if (t) {
        st.load({ ...t.build(), templateId: t.id });
        st.setStep(1);
        return;
      }
    }
    if (design) {
      const c = decodeDesign(design);
      if (c) {
        st.load({ ...c, id: uid("cake_") });
        toast({ title: "Shared design loaded", description: c.name, tone: "success" });
        return;
      }
      toast({ title: "That share link is invalid", tone: "error" });
    }
    if (saved) {
      const c = useSaved.getState().designs.find((d) => d.id === saved);
      if (c) {
        st.load(c);
        return;
      }
    }
    if (cart) {
      const item = useCart.getState().items.find((i) => i.id === cart);
      if (item) {
        st.load(item.config, { editingCartId: item.id });
        return;
      }
    }
    if (occasion && OCCASIONS.some((o) => o.id === occasion)) {
      st.load(createDefaultConfig(occasion));
      st.setStep(1);
      return;
    }
    if (params.get("new") === "1") {
      st.load(createDefaultConfig("birthday"));
      st.setStep(0);
      return;
    }
    // restore last auto-saved draft
    restoreDraft();
  }, [hydrated, params]);

  return <CakeBuilder />;
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="h-[calc(100dvh-4rem)] skeleton" />}>
      <StudioLoader />
    </Suspense>
  );
}
