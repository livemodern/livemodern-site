"use client";

import { useState, useEffect } from "react";
import { useUser, firstNameOf } from "@/lib/auth";
import Link from "next/link";
import Logo from "./Logo";
import BuildingSearch from "./BuildingSearch";
import { getBuildings } from "@/lib/communities";

type MastheadUser = { firstName?: string | null } | null;
type NavItem = { slug: string; name: string; city: string | null; county: string | null };

export default function Masthead({ active, user = null, loginBand }: { active?: string; user?: MastheadUser; loginBand?: boolean }) {
  const [open, setOpen] = useState(false);
  // Resolve the session here rather than threading a `user` prop through every
  // page: server components can't read it anyway (the session lives in
  // localStorage under 'lm-auth'). An explicit prop still wins if passed.
  const { user: authUser } = useUser();
  const resolvedUser: MastheadUser = user ?? (authUser ? { firstName: firstNameOf(authUser) } : null);
  const buildings: NavItem[] = getBuildings().map((b) => ({
    slug: b.slug,
    name: b.name,
    city: b.city,
    county: b.county,
  }));

  // Lock scroll + close on Escape while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const count = buildings.length;

  return (
    <div className="masthead">
      <div className="wrap">
        <div className="masthead-top">
          <span>Palm Beach · Fort Lauderdale · Miami</span>
          <span className="issue">{count} towers in the index · Updated weekly</span>
        </div>
        <div className="masthead-main">
          <Link href="/" className="logo" onClick={() => setOpen(false)}>
            <Logo />
          </Link>

          <nav className="nav">
            <Link href="/search" className={active === "search" ? "on" : undefined}>
              Search
            </Link>
            <Link href="/new-construction" className={active === "nc" ? "on" : undefined}>
              New Construction
            </Link>
            <Link href="/featured-buildings" className={active === "featured" ? "on" : undefined}>
              The Icons
            </Link>
            <Link href="/collections" className={active === "collections" ? "on" : undefined}>
              Collections
            </Link>
            <Link href="/journal" className={active === "journal" ? "on" : undefined}>
              Journal
            </Link>
            <Link href="/contact">Contact</Link>
          </nav>

          <div className="mast-right">
            <a className="mast-tel desk-only" href="tel:5612288420">
              561 228 8420
            </a>
            <button
              className={`burger${open ? " open" : ""}`}
              aria-label="Menu"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
              type="button"
            >
              <span />
              <span />
            </button>
          </div>

          {/* Desktop: Login sits BELOW the masthead rule — only on pages with a crumb band */}
          {loginBand && resolvedUser ? (
            <Link className="mast-login acct desk-only" href="/account">
              {resolvedUser.firstName ? `Hi, ${resolvedUser.firstName}` : "My Account"}
            </Link>
          ) : loginBand ? (
            <Link className="mast-login acct desk-only" href="/login">
              Login
            </Link>
          ) : null}
        </div>
      </div>

      {/* Slide-in drawer (mobile) */}
      <div className={`drawer-scrim${open ? " show" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`drawer${open ? " open" : ""}`} aria-hidden={!open}>
        <div className="drawer-head">
          <span className="drawer-eyebrow">The Index</span>
          <button className="drawer-x" aria-label="Close menu" onClick={() => setOpen(false)} type="button">
            &times;
          </button>
        </div>

        <BuildingSearch items={buildings} onNavigate={() => setOpen(false)} />

        <nav className="drawer-nav">
          <Link href="/search" onClick={() => setOpen(false)}>
            Search
          </Link>
          <Link href="/new-construction" onClick={() => setOpen(false)}>
            New Construction
          </Link>
          <Link href="/featured-buildings" onClick={() => setOpen(false)}>
            The Icons
          </Link>
          <Link href="/collections" onClick={() => setOpen(false)}>
            Collections
          </Link>
          <Link href="/journal" onClick={() => setOpen(false)}>
            Journal
          </Link>
          <Link href="/palm-beach-condos-for-sale" onClick={() => setOpen(false)}>
            Palm Beach
          </Link>
          <Link href="/fort-lauderdale-condos-for-sale" onClick={() => setOpen(false)}>
            Fort Lauderdale
          </Link>
          <Link href="/miami-luxury-condos" onClick={() => setOpen(false)}>
            Miami
          </Link>
          <a href="#inquire" onClick={() => setOpen(false)}>
            Contact
          </a>
        </nav>

        <div className="drawer-foot">
          {resolvedUser ? (
            <Link href="/account" onClick={() => setOpen(false)}>
              {resolvedUser.firstName ? `Hi, ${resolvedUser.firstName} — My Account` : "My Account"}
            </Link>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)}>
              Login / Register
            </Link>
          )}
          <a href="tel:5612288420">561 228 8420</a>
        </div>
      </aside>
    </div>
  );
}

