import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import MilaChat from "@/components/MilaChat";
import MilaAvatar from "@/components/MilaAvatar";

export const metadata: Metadata = {
  title: "Meet MiLa — Your AI Real Estate Concierge | LiveModern",
  description:
    "Chat with MiLa, Modern Living Group's AI concierge. She'll narrow your South Florida home search by how you want to live, show you real listings, and match you with the right agent.",
};

export default function MilaPage() {
  return (
    <>
      <Masthead active="mila" />
      <main className="mila-page">
        <section className="mila-hero">
          <div className="mila-hero-av"><MilaAvatar size={92} ring /></div>
          <p className="eyebrow">Your AI Concierge</p>
          <h1 className="serif">Meet MiLa</h1>
          <p className="mila-hero-sub">
            Tell me how you want to live, and I&rsquo;ll do the rest — narrow your search, show you the
            right homes, and connect you with the agent who knows your area best. Let&rsquo;s find it together.
          </p>
        </section>
        <section className="mila-chat-section">
          <MilaChat />
        </section>
      </main>
      <Footer />
    </>
  );
}
