import LeadForm from "@/components/LeadForm";

type Props = {
  eyebrow: string;
  heading: string;
  copy: string;
  cta?: string;
  withInterest?: boolean;
  /** CRM source_type; defaults per placement. */
  source?: string;
};

export default function LeadBand({
  eyebrow,
  heading,
  copy,
  cta = "Request a call",
  withInterest,
  source = "hub-inquiry",
}: Props) {
  return (
    <section className="lead" id="inquire">
      <div className="lead-in">
        <div className="lead-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="serif">{heading}</h2>
          <p>{copy}</p>
        </div>
        <LeadForm source={source} cta={cta} withInterest={withInterest} variant="dark" />
      </div>
    </section>
  );
}
