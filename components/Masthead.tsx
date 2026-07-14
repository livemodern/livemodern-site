import Link from "next/link";
import Logo from "./Logo";
import { getBuildings } from "@/lib/communities";

type MastheadUser = { firstName?: string | null } | null;

export default function Masthead({ active, user = null }: { active?: string; user?: MastheadUser }) {
  const count = getBuildings().length;
  return (
    <div className="masthead">
      <div className="wrap">
        <div className="masthead-top">
          <span>Palm Beach · Fort Lauderdale · Miami</span>
          <span className="issue">{count} towers in the index · Updated weekly</span>
          <span>561 228 8420</span>
        </div>
        <div className="masthead-main">
          <Link href="/" className="logo">
            <Logo />
          </Link>
          <nav className="nav">
            <Link href="/new-construction" className={active === "nc" ? "on" : undefined}>
              New Construction
            </Link>
            <Link href="/modern-homes" className={active === "homes" ? "on" : undefined}>
              Modern Homes
            </Link>
            <a href="#inquire">Contact</a>
          </nav>
          <div className="mast-right">
            {user ? (
              <Link className="acct" href="/account">
                {user.firstName ? `Hi, ${user.firstName}` : "My Account"}
              </Link>
            ) : (
              <Link className="acct" href="/login">
                Login
              </Link>
            )}
            <span className="burger" aria-hidden="true">
              <span />
              <span />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
