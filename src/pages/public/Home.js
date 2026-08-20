import React from 'react';
import { Hero, TrustBar, Products, GalleryStrip, HowItWorks } from './HomeTop';
import { WhyUs, Founders, SchemesPreview, GauSevaSection, DeliveryAreas, Testimonials, FAQ, ContactCTA } from './HomeBottom';

export default function PublicHome() {
  return (
    <>
      <Hero />
      <TrustBar />
      <Products />
      <GalleryStrip />
      <HowItWorks />
      <WhyUs />
      <Founders />
      <SchemesPreview />
      <GauSevaSection />
      <DeliveryAreas />
      <Testimonials />
      <FAQ />
      <ContactCTA />
    </>
  );
}
