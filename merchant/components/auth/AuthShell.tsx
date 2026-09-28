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
    <main className="min-h-screen bg-white px-5 py-8 text-[#253a2e] sm:px-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <Link href="/auth/login" className="mb-8 inline-flex w-fit items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/image/logo.png" alt="" className="h-10 w-10 object-contain" />
          <span className="font-heading text-lg font-bold text-[#1b4332]">LocalVegetable</span>
        </Link>

        <section>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#765238]">{eyebrow}</p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-[#20382b] sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-[#5d685f]">{description}</p>
          <div className="mt-7">{children}</div>
          {footer && (
            <div className="mt-7 border-t border-[#e4e8e2] pt-5 text-center text-sm text-[#5d685f]">
              {footer}
            </div>
          )}
        </section>

        <p className="mt-8 text-center text-xs text-[#68746a]">Merchant &amp; Partner Network</p>
      </div>
    </main>
  );
}
