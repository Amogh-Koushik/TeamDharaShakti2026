import type { Metadata } from "next";
import DashboardLayout from "@/components/layout/DashboardLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "TriNetra | AI-Powered Mine Rescue Rover",
  description: "Advanced dashboard for live teleoperation, 3D mapping, and rescue operations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              const observer = new MutationObserver(() => {
                document.querySelectorAll('[bis_skin_checked]').forEach(el => {
                  el.removeAttribute('bis_skin_checked');
                });
              });
              observer.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['bis_skin_checked'] });
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </body>
    </html>
  );
}
