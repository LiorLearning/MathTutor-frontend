export const metadata = {
  title: "Lior Learning: AI Math Tutor",
  description: "1:1 AI Math Tutor for Homeschooling kids",
};

import Home from "@/components/homepage/home";
import { ThemeProvider } from "@/components/themeContext";

export default function HomePage() {
  return (
    <ThemeProvider>
      <Home />
    </ThemeProvider>
  );
}
