import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="ftr">
      <div className="wrap">
        <div className="ftr-grid">
          <div>
            <Link href="/" className="logo">
              <Logo />
            </Link>
            <p className="blurb">
              South Florida&rsquo;s new towers and modern homes, indexed. LiveModern is a brand
              of Modern Living Group at Compass.
            </p>
          </div>
          <div>
            <h4>Index</h4>
            <ul>
              <li><Link href="/new-construction">New Construction</Link></li>
              <li><Link href="/new-construction">Now Selling</Link></li>
              <li><Link href="/new-construction">Move-in Ready</Link></li>
              <li><Link href="/new-construction">Pre-Construction</Link></li>
            </ul>
          </div>
          <div>
            <h4>Modern Homes</h4>
            <ul>
              <li><Link href="/modern-waterfront-homes-south-florida">Waterfront</Link></li>
              <li><Link href="/palm-beach-boating-homes">Boating</Link></li>
              <li><Link href="/palm-beach-golf-course-homes">Golf</Link></li>
              <li><Link href="/palm-beach-equestrian-homes">Equestrian</Link></li>
            </ul>
          </div>
          <div>
            <h4>Markets</h4>
            <ul>
              <li><Link href="/new-construction">Palm Beach</Link></li>
              <li><Link href="/new-construction">Fort Lauderdale</Link></li>
              <li><Link href="/new-construction">Miami</Link></li>
              <li><a href="#inquire">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="legal">
          <p>
            All listings featuring the BMLS logo are provided by BeachesMLS, Inc. This information
            is not verified for authenticity or accuracy and is not guaranteed. Copyright &copy;
            {year} BeachesMLS, Inc. LiveModern &middot; Modern Living Group at Compass.
          </p>
        </div>
      </div>
    </footer>
  );
}
