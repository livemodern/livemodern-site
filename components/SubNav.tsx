"use client";

type Item = { href: string; label: string };

/**
 * In-page section nav. Smooth-scrolls to the target section but does NOT leave
 * the #hash in the URL — so a refresh returns you to the top of the page
 * instead of re-jumping to (e.g.) #floorplans.
 */
export default function SubNav({ items }: { items: Item[] }) {
  const onClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (!el) return; // let the browser handle it if the target isn't found
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    // Clear any lingering hash so refresh doesn't re-jump.
    history.replaceState(null, "", window.location.pathname + window.location.search);
  };

  return (
    <nav className="subnav">
      <div className="subnav-in">
        {items.map((it) => (
          <a key={it.href} href={it.href} onClick={(e) => onClick(e, it.href)}>
            {it.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
