export default function Home() {
  const year = new Date().getFullYear();
  return (
    <main className="page">
      <header className="masthead">
        <span className="mark">LIVEMODERN</span>
        <span className="meta">Est. South Florida</span>
      </header>

      <section className="hero">
        <p className="eyebrow">South Florida Luxury Real Estate</p>
        <h1 className="title">
          Live <em>modern</em>.
        </h1>
        <p className="lede">
          A new home for the region&rsquo;s most distinctive residences &mdash;
          from the waterfront towers of West Palm Beach to Miami and Fort
          Lauderdale.
        </p>
      </section>

      <footer className="footer">
        <ul className="markets">
          <li>West Palm Beach</li>
          <li>Miami</li>
          <li>Fort Lauderdale</li>
        </ul>
        <p className="status">New platform in progress &middot; {year}</p>
      </footer>
    </main>
  );
}
