import Link from "next/link";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function AuthShell({ eyebrow, title, description, children, footer }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8 sm:px-6 lg:flex lg:items-center lg:py-12">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2.5rem] bg-white shadow-2xl shadow-emerald-900/5 lg:min-h-[660px] lg:grid-cols-[1fr_1.1fr]">
        
        {/* Left Side: Brand & Visuals */}
        <aside className="relative hidden overflow-hidden bg-emerald-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1595858603673-90d40e4bf1cb?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/80 to-transparent"></div>
          
          {/* Top-left radial glow */}
          <div className="absolute -left-32 -top-32 h-[30rem] w-[30rem] rounded-full bg-emerald-500/20 blur-[100px]" />

          <div className="relative z-10">
            <Link href="/auth/login" className="flex items-center gap-3 transition hover:opacity-90">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1.5 shadow-lg shadow-emerald-950/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/image/logo.png" alt="LocalVeg" className="h-full w-full object-contain" />
              </span>
              <span className="text-xl font-black tracking-tight text-white font-heading">LocalVeg</span>
            </Link>
          </div>
          
          <div className="relative z-10 mt-auto">
            <p className="mb-4 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold tracking-widest text-emerald-300 uppercase backdrop-blur-sm">
              From harvest to doorstep
            </p>
            <h2 className="max-w-sm text-4xl font-black leading-[1.1] text-white">
              Fresh deliveries, <br/><span className="text-emerald-400">clearly coordinated.</span>
            </h2>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-emerald-100/80">
              One secure workspace for merchants and their trusted distribution partners to streamline operations.
            </p>
            
            <div className="mt-10 grid grid-cols-3 gap-3">
              {[
                { label: 'Secure access', icon: '🔒' },
                { label: 'Live updates', icon: '⚡' },
                { label: 'Order progress', icon: '📦' }
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition hover:bg-white/10">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-center text-[11px] font-semibold text-emerald-100">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Side: Form Content */}
        <section className="flex items-center p-6 sm:p-10 lg:p-16">
          <div className="mx-auto w-full max-w-sm">
            <Link href="/auth/login" className="mb-10 flex items-center gap-3 font-black text-gray-900 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1 border border-[#dfe6d9] shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/image/logo.png" alt="LocalVeg" className="h-full w-full object-contain" />
              </span>
              <span className="text-xl font-heading font-black">LocalVeg</span>
            </Link>
            
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-600">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900">{title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">{description}</p>
            
            <div className="mt-8">{children}</div>
            
            {footer && (
              <div className="mt-8 border-t border-gray-100 pt-8 text-center text-sm font-medium text-gray-500">
                {footer}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
