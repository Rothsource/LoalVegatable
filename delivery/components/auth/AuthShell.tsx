import { BadgeCheck, Bike, MapPinned, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/ui/Brand";

export function AuthShell({ children, step }: { children: React.ReactNode; step?: number }) {
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)]">
      <section className="relative hidden overflow-hidden bg-[var(--leaf-dark)] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[58px] border-white/[0.035]" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#8fbd74]/10 blur-2xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2.5">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[var(--leaf)]"><Bike size={21} /></span>
            <div><p className="font-black">Local Vegetable</p><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#cfe7c4]">Delivery portal</p></div>
          </div>
          <div className="mt-20 max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-[#e3f1dd]"><ShieldCheck size={14} /> Authorized riders only</span>
            <h1 className="balance mt-6 text-5xl font-black leading-[1.05] tracking-[-0.05em] xl:text-6xl">Every delivery.<br />One clear next step.</h1>
            <p className="mt-6 max-w-md text-base leading-7 text-[#cfdfc9]">A focused workspace for accepting requests, reaching customers, and completing deliveries with confidence.</p>
          </div>
        </div>
        <div className="relative grid grid-cols-3 gap-3">
          {[{ icon: BadgeCheck, text: "Verified access" }, { icon: MapPinned, text: "Clear destination" }, { icon: Bike, text: "Rider focused" }].map((item) => (
            <div key={item.text} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4"><item.icon size={19} className="text-[#cde5a0]" /><p className="mt-3 text-xs font-bold text-[#edf6e9]">{item.text}</p></div>
          ))}
        </div>
      </section>
      <section className="flex min-h-screen flex-col bg-[var(--canvas)] px-5 py-6 sm:px-8 lg:px-14 xl:px-20">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="lg:hidden"><Brand /></div>
          {step && (
            <div className="flex items-center gap-2" aria-label={`Activation step ${step} of 3`}>
              {[1, 2, 3].map((item) => <span key={item} className={`h-1.5 rounded-full transition-all ${item === step ? "w-7 bg-[var(--leaf)]" : item < step ? "w-3 bg-[#9abe8b]" : "w-3 bg-[#d8e1d3]"}`} />)}
            </div>
          )}
        </div>
        <div className="mx-auto flex w-full max-w-[460px] flex-1 items-center py-8 sm:py-12">
          <div className="enter-up w-full">{children}</div>
        </div>
        <p className="text-center text-[11px] leading-5 text-[#879282]">Frontend demo · No real account or delivery data is sent</p>
      </section>
    </main>
  );
}
