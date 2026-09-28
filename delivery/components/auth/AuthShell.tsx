import { Brand } from "@/components/ui/Brand";

export function AuthShell({ children, step }: { children: React.ReactNode; step?: number }) {
  return (
    <main className="min-h-screen bg-white px-5 py-8 text-[#253a2e] sm:px-8 sm:py-12">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-8 flex items-center justify-between">
          <Brand />
          {step && (
            <div className="flex items-center gap-2" aria-label={`Activation step ${step} of 3`}>
              {[1, 2, 3].map((item) => (
                <span
                  key={item}
                  className={`h-1.5 rounded-full transition-all ${
                    item === step
                      ? "w-7 bg-[#8c5228]"
                      : item < step
                      ? "w-3 bg-[#d99b63]"
                      : "w-3 bg-[#382b21]"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="w-full">{children}</div>
        <p className="mt-8 text-center text-xs text-[#68746a]">Courier &amp; Dispatch Portal</p>
      </section>
    </main>
  );
}
