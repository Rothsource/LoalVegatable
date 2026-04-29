import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      {/* TODO: Add more sections here — Categories, Featured Products, etc. */}
      <Footer />
    </main>
  );
}