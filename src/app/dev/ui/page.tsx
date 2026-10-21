import { notFound } from "next/navigation";
import { UiShowcase } from "./ui-showcase";

export const metadata = {
  title: "Design System Showcase | Dev",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <UiShowcase />;
}
