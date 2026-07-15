import Link from "next/link";
import type { Community } from "@/lib/communities";
import { cf } from "@/lib/communities";

export default function IndexRow({ c }: { c: Community }) {
  return (
    <Link className="row" href={`/${c.slug}`}>
      <img className="row-thumb" src={cf(c.hero, 184)} alt="" width={92} height={92} loading="lazy" />
      <div>
        <div className="row-n serif">{c.name}</div>
        <div className="row-m">
          {c.city ? <span>{c.city}</span> : null}
          {c.city && c.county ? <span className="sep">/</span> : null}
          {c.county ? <span>{c.county}</span> : null}
          <span className="sep">/</span>
          <span className="pill pill--live">Now Rising</span>
        </div>
      </div>
      <div className="row-p">
        <small>Pricing</small>
        Upon request
      </div>
      <div className="row-a" aria-hidden="true">&rarr;</div>
    </Link>
  );
}
