import LeadForm from "@/components/LeadForm";

type Props = {
  eyebrow: string;
  heading: string;
  copy: string;
  cta?: string;
  withInterest?: boolean;
  /** CRM source_type; defaults per placement. Named for the building/community
   *  page this band sits on — NOT the MiLa HUB, which is a different system
   *  entirely (the old "hub-inquiry" name made that lead look like a chat). */
  source?: string;
  /** Building / community context — see LeadForm. Pass both on community pages. */
  communitySlug?: string;
  communityName?: string;
};

export default function LeadBand({
  eyebrow,
  heading,
  copy,
  cta = "Request a call",
  withInterest,
  source = "building-inquiry",
  communitySlug,
  communityName,
}: Props) {
  return (
    <section className="lead" id="inquire">
      <div className="lead-in">
        <div className="lead-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="serif">{heading}</h2>
          <p>{copy}</p>
        </div>
        <LeadForm
          source={source}
          cta={cta}
          withInterest={withInterest}
          variant="dark"
          communitySlug={communitySlug}
          communityName={communityName}
        />
      </div>
    </section>
  );
}
