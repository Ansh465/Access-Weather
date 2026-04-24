import "./globals.css";
import { Space_Grotesk, Playfair_Display } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans"
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display"
});

export const metadata = {
  title: "AccessWeather",
  description: "Search cities and view UK weather with AccessWeather."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
