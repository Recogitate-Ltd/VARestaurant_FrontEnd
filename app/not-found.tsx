import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-6 py-24 text-center">
      <p className="text-gold-dark text-[12px] uppercase tracking-[0.3em]">404</p>
      <h1 className="mt-2 font-display text-[36px] font-medium text-white">This page has been decanted</h1>
      <p className="mt-3 text-ink-soft">We couldn&apos;t find what you were looking for.</p>
      <ButtonLink href="/wines" className="mt-6">
        Browse wines
      </ButtonLink>
    </main>
  );
}
