import { AppTour } from "@/components/apps/app-tour";
import { Contact } from "@/components/contact/contact";
import { Hero } from "@/components/hero/hero";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Process } from "@/components/process/process";
import { Showcase } from "@/components/showcase/showcase";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <Hero />
        <Showcase />
        <AppTour />
        <Process />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
