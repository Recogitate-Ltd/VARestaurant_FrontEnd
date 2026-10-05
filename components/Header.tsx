"use client";

import clsx from "clsx";
import { Menu, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import BasketDrawer from "@/components/BasketDrawer";
import { Logo } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useBasket } from "@/lib/basket";
import { money } from "@/lib/format";

/*
 * Mirrors the investment app's header (WineApp-mobile components/layout/header.tsx):
 * desktop is an 88px bar with the gold VA mark centred between two groups of
 * light nav links; phones get a 64px bar with the menu on the left, the mark
 * centred and the basket on the right, and a full-screen menu in Cormorant.
 */

type NavItem = { title: string; href?: string; onClick?: () => void };

function isActive(pathname: string, href?: string) {
  return !!href && href !== "/" && (pathname === href || pathname.startsWith(`${href}/`));
}

function DesktopLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const cls = clsx(
    "p-4 text-[14px] tracking-[1.2px] font-light select-none transition-colors duration-[250ms] whitespace-nowrap",
    isActive(pathname, item.href) ? "text-gold-dark" : "text-white hover:text-gold-dark"
  );
  return item.href ? (
    <Link href={item.href} className={cls}>
      {item.title}
    </Link>
  ) : (
    <button type="button" onClick={item.onClick} className={cls}>
      {item.title}
    </button>
  );
}

function BasketButton({ onClick, small = false }: { onClick: () => void; small?: boolean }) {
  const { units, total, addedAt, ready } = useBasket();
  const [bump, setBump] = useState(false);
  useEffect(() => {
    if (!addedAt) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 450);
    return () => clearTimeout(t);
  }, [addedAt]);

  return (
    <button
      onClick={onClick}
      className={clsx(
        "relative flex items-center justify-center gap-2 rounded-md p-2 text-gold hover:bg-raised transition-transform",
        bump && "scale-110"
      )}
      aria-label={`Basket, ${units} item${units === 1 ? "" : "s"}`}
    >
      <ShoppingBag className={small ? "h-[22px] w-[22px]" : "h-6 w-6"} strokeWidth={1.5} />
      {!small && ready && units > 0 && (
        <span className="text-[13px] tracking-[1.2px] font-light text-white">{money(total)}</span>
      )}
      {ready && units > 0 && (
        <span className="absolute -top-1 -right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold px-1 text-[10px] font-semibold leading-[18px] text-[#121416]">
          {units}
        </span>
      )}
    </button>
  );
}

export default function Header() {
  const pathname = usePathname() || "/";
  const { state, account, logout } = useAuth();
  const { units, total, ready } = useBasket();
  const [basketOpen, setBasketOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Transparent over the cellar video at the top of the page; solid once scrolled.
  const [scrolled, setScrolled] = useState(false);

  const approved = account?.status === "approved";
  const signedIn = state === "signed-in";
  const inCheckout = pathname.startsWith("/checkout");
  const homeHref = approved ? "/wines" : "/";

  useEffect(() => {
    setMenuOpen(false);
    setBasketOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  // Approved accounts get six links, split three either side of the VA mark so
  // the bar balances around it.
  const left: NavItem[] = approved
    ? [
        { title: "Wines", href: "/wines" },
        { title: "Accessories", href: "/accessories" },
        { title: "Orders", href: "/orders" },
      ]
    : signedIn
      ? []
      : [{ title: "How it works", href: "/" }];
  const right: NavItem[] = signedIn
    ? [
        ...(approved ? [{ title: "Requests", href: "/requests" }] : []),
        { title: "Account", href: "/account" },
        { title: "Logout", onClick: logout },
      ]
    : [
        { title: "Log in", href: "/login" },
        { title: "Apply", href: "/apply" },
      ];
  const mobileItems = [...left, ...right];

  return (
    <>
      <header
        className={clsx(
          "sticky top-0 z-40 w-full transition-colors duration-300",
          scrolled || menuOpen ? "bg-base/95 backdrop-blur" : "bg-transparent"
        )}
      >
        {/* Desktop */}
        <div className="hidden lg:flex items-center h-[88px] px-6">
          {/* Equal-width end slots keep the mark dead centre, whatever the basket shows */}
          <div className="w-40 shrink-0" />
          <nav className="flex flex-1 min-w-0 items-center justify-end gap-2" aria-label="Main">
            {left.map((item) => (
              <DesktopLink key={item.title} item={item} pathname={pathname} />
            ))}
          </nav>
          <Link href={homeHref} className="mx-10 shrink-0" aria-label="Vintage Associates Trade home">
            <Logo size={56} />
          </Link>
          <nav className="flex flex-1 min-w-0 items-center justify-start gap-2" aria-label="Account">
            {right.map((item) => (
              <DesktopLink key={item.title} item={item} pathname={pathname} />
            ))}
          </nav>
          <div className="w-40 shrink-0 flex justify-end">
            {approved && !inCheckout && <BasketButton onClick={() => setBasketOpen(true)} />}
          </div>
        </div>

        {/* Phones and tablets */}
        <div className="lg:hidden relative flex items-center justify-between h-16 px-5">
          {mobileItems.length ? (
            <button
              className="-ml-2 grid place-items-center p-2 text-gold"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X className="h-6 w-6" strokeWidth={1.5} /> : <Menu className="h-6 w-6" strokeWidth={1.5} />}
            </button>
          ) : (
            <span className="w-11" />
          )}
          <Link
            href={homeHref}
            className="absolute left-1/2 -translate-x-1/2"
            aria-label="Vintage Associates Trade home"
          >
            <Logo size={35} />
          </Link>
          {approved && !inCheckout ? (
            <BasketButton small onClick={() => setBasketOpen(true)} />
          ) : (
            <span className="w-11" />
          )}
        </div>
      </header>

      {/* Full-screen phone menu, as in the app */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-base px-8 pt-6 pb-10 overflow-y-auto">
          {account && (
            <p className="mb-4 text-[11px] uppercase tracking-[1.2px] text-ink-faint">{account.business_name}</p>
          )}
          <nav aria-label="Mobile">
            {mobileItems.map((item) => {
              const cls = clsx(
                "block w-full py-2 text-left font-display font-light uppercase text-[1.35rem] tracking-[0.04em]",
                isActive(pathname, item.href) ? "text-gold-dark" : "text-white"
              );
              return item.href ? (
                <Link key={item.title} href={item.href} className={cls}>
                  {item.title}
                </Link>
              ) : (
                <button key={item.title} type="button" onClick={item.onClick} className={cls}>
                  {item.title}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {approved && <BasketDrawer open={basketOpen} onClose={() => setBasketOpen(false)} />}

      {/* Phones: a sticky bar back to the basket once there is something in it. */}
      {approved && ready && units > 0 && !inCheckout && !menuOpen && !pathname.startsWith("/basket") && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-base via-base/95 to-transparent">
          <button
            onClick={() => setBasketOpen(true)}
            className="w-full h-12 rounded-xl bg-gold text-black shadow-lift flex items-center justify-between px-5 text-[15px]"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
              View basket ({units})
            </span>
            <span>{money(total)}</span>
          </button>
        </div>
      )}
    </>
  );
}
