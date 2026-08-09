import { StatusBar } from "@/components/status-bar";
import { Footer } from "@/components/footer";
import { DevtoolsGuard } from "@/components/devtools-guard";
import { FeedbackFab } from "@/components/feedback-fab";
import { AnnouncementBanner } from "@/components/announcement-banner";

export default function NotifiLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <DevtoolsGuard />
      <AnnouncementBanner />
      <StatusBar />
      {children}
      <Footer />
      <FeedbackFab />
    </>
  );
}
