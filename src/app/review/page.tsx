"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Heart, Pencil, Share2, ShoppingBag } from "lucide-react";
import { restoreDraft, useCakeStore } from "@/store/cakeStore";
import { toast, useCart, useSaved, useUI } from "@/store/appStore";
import { CakeSpecs, CakeThumb } from "@/components/cart/CakeSummary";
import { PriceBreakdownList, WarningList } from "@/components/builder/PriceSummary";
import { validateDesign, hasBlockingErrors } from "@/lib/cake/validation";
import { shareDesign } from "@/components/builder/actions";
import { supportsWebGL } from "@/components/builder/Fallback2D";
import { uid } from "@/lib/utils";

const CakeShowcase = dynamic(() => import("@/components/three/CakeShowcase"), { ssr: false, loading: () => <div className="skeleton h-full w-full rounded-3xl" /> });

export default function ReviewPage() {
  const router = useRouter();
  const hydrated = useUI((s) => s.hydrated);
  const config = useCakeStore((s) => s.config);
  const editingCartId = useCakeStore((s) => s.editingCartId);
  const [ready, setReady] = useState(false);
  const [webgl, setWebgl] = useState(true);
  useEffect(() => setWebgl(supportsWebGL()), []);

  useEffect(() => {
    if (!hydrated || ready) return;
    // came here directly (refresh) → use the auto-saved draft
    if (useCakeStore.getState().past.length === 0 && !useCakeStore.getState().config.thumbnail) restoreDraft();
    setReady(true);
  }, [hydrated, ready]);

  const warnings = useMemo(() => validateDesign(config), [config]);
  const blocking = hasBlockingErrors(config);

  const addToCart = () => {
    if (blocking) return toast({ title: "Please fix the highlighted issues first", tone: "error" });
    const cart = useCart.getState();
    if (editingCartId && cart.items.some((i) => i.id === editingCartId)) {
      cart.replace(editingCartId, config);
      useCakeStore.setState({ editingCartId: null });
      toast({ title: "Cart item updated", tone: "success" });
    } else {
      cart.add(config);
      toast({ title: "Added to cart", description: config.name, tone: "success" });
    }
    router.push("/cart");
  };

  const duplicate = () => {
    const copy = { ...config, id: uid("cake_"), name: `${config.name} (copy)`, createdAt: Date.now() };
    useSaved.getState().save(copy);
    toast({ title: "Design duplicated", description: "The copy is in Saved Designs.", tone: "success" });
  };

  if (!ready) return <div className="mx-auto mt-10 h-[70vh] max-w-6xl skeleton rounded-3xl" />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link href="/studio" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent">
        <ArrowLeft className="h-4 w-4" /> Back to studio
      </Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="glass relative h-[52vh] min-h-[360px] overflow-hidden rounded-[2rem] lg:sticky lg:top-24 lg:h-[72vh]">
          {webgl ? <CakeShowcase config={config} className="!absolute inset-0" /> : <CakeThumb config={config} className="h-full w-full" />}
          <span className="glass absolute left-4 top-4 rounded-full px-3 py-1 text-xs text-muted">Cinematic preview · drag to rotate</span>
          {config.thumbnail && (
            <div className="glass absolute bottom-4 left-4 flex items-center gap-2 rounded-2xl p-1.5 pr-3">
              <CakeThumb config={config} className="h-14 w-14 rounded-xl" />
              <span className="text-xs text-muted">Captured<br />thumbnail</span>
            </div>
          )}
        </motion.div>

        <div>
          <p className="label text-accent">Review my cake</p>
          <h1 className="mt-2 font-display text-4xl">{config.name}</h1>
          <div className="mt-6 glass rounded-3xl p-5">
            <CakeSpecs config={config} />
          </div>
          {warnings.length > 0 && (
            <div className="mt-4">
              <WarningList warnings={warnings} />
            </div>
          )}
          <div className="mt-4 glass rounded-3xl p-5">
            <h2 className="mb-3 font-semibold">Price breakdown</h2>
            <PriceBreakdownList config={config} />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <button className="btn btn-primary flex-1 px-6 py-3.5" onClick={addToCart} disabled={blocking}>
              <ShoppingBag className="h-4 w-4" /> {editingCartId ? "Update cart item" : "Add to cart"}
            </button>
            <Link href="/studio" className="btn btn-ghost px-5 py-3.5">
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <button className="btn btn-ghost py-2.5 text-sm" onClick={() => (useSaved.getState().save(config), toast({ title: "Design saved", tone: "success" }))}>
              <Heart className="h-4 w-4" /> Save
            </button>
            <button className="btn btn-ghost py-2.5 text-sm" onClick={duplicate}>
              <Copy className="h-4 w-4" /> Duplicate
            </button>
            <button className="btn btn-ghost py-2.5 text-sm" onClick={() => shareDesign(config)}>
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
