import Link from "next/link";
import Logo from "./Logo";
import { getBuildings } from "@/lib/communities";

export default function Masthead({ active }: { active?: string }) {
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
            <a className="tel" href="tel:5612288420">
              561 228 8420
            </a>
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
