import { AppTour } from "@/components/apps/app-tour";
import { Hero } from "@/components/hero/hero";
import { SiteHeader } from "@/components/layout/site-header";
import { Showcase } from "@/components/showcase/showcase";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <Hero />
        <Showcase />
        <AppTour />
      </main>
    </>
  );
}
