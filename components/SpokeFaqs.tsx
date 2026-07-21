"use client";

import { useState } from "react";
import type { SpokeFaq } from "@/lib/spoke-content";

export default function SpokeFaqs({ faqs }: { faqs: SpokeFaq[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="spoke-faqs">
      {faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <div className={`spoke-faq${isOpen ? " open" : ""}`} key={i}>
            <button
              type="button"
              className="spoke-faq-q"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span>{f.q}</span>
              <span className="spoke-faq-i" aria-hidden="true">
                {isOpen ? "\u2212" : "+"}
              </span>
            </button>
            {isOpen ? <div className="spoke-faq-a">{f.a}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
