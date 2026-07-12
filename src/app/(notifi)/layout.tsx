import { StatusBar } from "@/components/status-bar";
import { Footer } from "@/components/footer";
import { DevtoolsGuard } from "@/components/devtools-guard";
import { FeedbackFab } from "@/components/feedback-fab";

export default function NotifiLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <DevtoolsGuard />
      <StatusBar />
      {children}
      <Footer />
      <FeedbackFab />
    </>
  );
}
