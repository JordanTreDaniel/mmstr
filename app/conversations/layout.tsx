import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conversations",
  description:
    "Join or create MMSTR discussions. Practice the 'That's Right' negotiation technique from Never Split the Difference with real people.",
  openGraph: {
    title: "Conversations | MMSTR",
    description:
      "Join or create MMSTR discussions. Practice the 'That's Right' negotiation technique with real people.",
    url: "https://mmstr.jordanchristley.com/conversations",
  },
  twitter: {
    title: "Conversations | MMSTR",
    description:
      "Join or create MMSTR discussions. Practice the 'That's Right' negotiation technique with real people.",
  },
  alternates: {
    canonical: "https://mmstr.jordanchristley.com/conversations",
  },
};

export default function ConversationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
