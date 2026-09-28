import Link from "next/link";
import Image from "next/image";

type CustomerAuthLayoutProps = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function CustomerAuthLayout({
  eyebrow = "Fresh Local Market",
  title,
  subtitle,
  children,
  footer,
}: CustomerAuthLayoutProps) {
  return (
    <main className="min-h-screen bg-white px-4 py-8 text-[#1a2e22] sm:px-6 sm:py-14 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Top Brand Header */}
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-3 transition-transform hover:scale-[1.02]">
            <Image
              src="/image/logo.png"
              alt="LocalVegetable logo"
              width={44}
              height={44}
              className="h-11 w-11 rounded-xl object-contain shadow-sm"
              priority
            />
            <div className="text-left">
              <span className="block font-heading text-xl font-extrabold tracking-tight text-[#1b4332]">
                Local<span className="text-[#2d6a4f]">Vegetable</span>
              </span>
              <span className="block text-[11px] font-semibold text-[#52796f]">
                Farm Fresh Cambodia · បន្លែស្រស់ក្នុងស្រុក
              </span>
            </div>
          </Link>
        </div>

        {/* Elevated Form Card on Pure White */}
        <section className="rounded-3xl border border-[#e5ebe4] bg-white p-6 shadow-[0_12px_40px_rgba(27,67,50,0.06)] sm:p-9">
          <div className="text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d2e4d3] bg-[#edf4ed] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#1b4332]">
              {eyebrow}
            </span>
            <h1 className="mt-3 font-heading text-2xl font-extrabold tracking-tight text-[#1b4332] sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#526357]">
              {subtitle}
            </p>
          </div>

          <div className="mt-7">{children}</div>

          {footer && (
            <div className="mt-7 border-t border-[#edf2ec] pt-5 text-center text-xs sm:text-sm text-[#526357]">
              {footer}
            </div>
          )}
        </section>

        {/* Trust Badge / Subtext */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs font-medium text-[#647469]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#1b4332]" />
          <span>Connecting you directly with local Cambodian farmers</span>
        </div>
      </div>
    </main>
  );
}
