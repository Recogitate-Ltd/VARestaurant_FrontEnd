import { FullLogo } from "@/components/ui";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/format";

/*
 * Mirrors the investment app's footer (WineApp-mobile components/layout/footer.tsx):
 * a centred column with the full gold logo, the Instagram link and one line of
 * small uppercase legal and contact links.
 */
const LINK = "text-[10px] text-white tracking-[1.2px] uppercase font-light text-center hover:text-gold-dark";

export default function Footer() {
  const tel = SUPPORT_PHONE.replace(/\s/g, "").replace(/^0/, "+44");
  return (
    <footer className="relative z-10 mt-20 w-full bg-base flex flex-col items-center justify-center gap-4 py-10 pb-28 lg:pb-10">
      <FullLogo />
      <a
        className="mt-2 mb-2"
        target="_blank"
        rel="noreferrer"
        href="https://www.instagram.com/vintageassociatesfinewine/"
        aria-label="Vintage Associates on Instagram"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/instagram.png" alt="" width={30} height={30} className="h-[30px] w-[30px] object-contain" />
      </a>
      <div className="flex flex-row flex-wrap justify-center px-6 gap-x-3 gap-y-1">
        <span className={LINK}>© {new Date().getFullYear()} Vintage Associates - All rights reserved. Company No. 11804055.</span>
        <a href={`tel:${tel}`} className={LINK}>
          Call +44 (0) {SUPPORT_PHONE.replace(/^0/, "")}
        </a>
        <a href={`mailto:${SUPPORT_EMAIL}`} className={LINK}>
          {SUPPORT_EMAIL}
        </a>
      </div>
      <p className="px-6 text-[10px] tracking-[1.2px] uppercase font-light text-ink-faint text-center">
        Trade customers only · Wine prices ex VAT · Minimum order £450 inc VAT · Please drink responsibly
      </p>
    </footer>
  );
}
