export default function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "MMSTR — Make Me Say That's Right",
    description:
      "The only app that lets you live-practice Chris Voss's 'That's Right' negotiation technique with real people. Turn-based discussions that enforce comprehension before rebuttal.",
    url: "https://mmstr.jordanchristley.com",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: "Jordan Christley",
    },
    keywords:
      "Chris Voss, Never Split the Difference, That's Right, negotiation practice, tactical empathy, mirroring, FBI negotiation",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
