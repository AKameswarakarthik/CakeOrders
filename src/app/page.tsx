import { Hero } from "@/components/home/Hero";
import { BuildYourOwn, DeliveryInfo, FinalCTA, FlavorCombos, HowItWorks, OccasionGrid, Reviews, Trending } from "@/components/home/Sections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <OccasionGrid />
      <Trending />
      <BuildYourOwn />
      <FlavorCombos />
      <Reviews />
      <HowItWorks />
      <DeliveryInfo />
      <FinalCTA />
    </>
  );
}
