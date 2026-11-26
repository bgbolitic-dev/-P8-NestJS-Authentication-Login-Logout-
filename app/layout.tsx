import "./globals.css";
// CHANGED: Plus Jakarta Sans for the interface, Fraunces for big headlines
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import { cn } from "@/lib/utils";

// CHANGED: was Geist
const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });
// CHANGED: NEW - the headline font (used with the class "font-display")
const display = Fraunces({ subsets: ["latin"], variable: "--font-display" });


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
        // CHANGED: both fonts are attached to the page
    <html lang="en" suppressHydrationWarning className={cn("font-sans", sans.variable, display.variable)}>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}