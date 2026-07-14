type Props = { eyebrow: string; heading: string; copy: string; cta?: string; withInterest?: boolean };

export default function LeadBand({ eyebrow, heading, copy, cta = "Request a call", withInterest }: Props) {
  return (
    <section className="lead" id="inquire">
      <div className="lead-in">
        <div className="lead-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="serif">{heading}</h2>
          <p>{copy}</p>
        </div>
        <form className="form" action="/api/leads" method="post">
          <div className="two">
            <input name="name" placeholder="Name" aria-label="Name" required />
            <input name="phone" placeholder="Phone" aria-label="Phone" inputMode="tel" />
          </div>
          <input name="email" type="email" placeholder="Email" aria-label="Email" required />
          {withInterest ? (
            <select name="interest" aria-label="Interest" defaultValue="">
              <option value="">Interest — select one</option>
              <option>1 bedroom</option>
              <option>2 bedroom</option>
              <option>3 bedroom</option>
              <option>Penthouse</option>
            </select>
          ) : (
            <textarea name="message" rows={2} placeholder="What are you looking for?" aria-label="Message" />
          )}
          <button className="btn btn-solid" type="submit">{cta}</button>
          <p className="fine">We reply the same day. No drip campaigns, no auto-dialers.</p>
        </form>
      </div>
    </section>
  );
}
