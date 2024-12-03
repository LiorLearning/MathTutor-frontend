"use client";

import { useEffect } from "react";

import AOS from "aos";
import "aos/dist/aos.css";

import Hero from "@/components/homepage/hero-home";
import FeaturesPlanet from "@/components/homepage/features-planet";
import LargeTestimonial from "@/components/homepage/large-testimonial";
import Header from "@/components/homepage/header";
import Footer from "@/components/homepage/footer";

export default function Home() {
  useEffect(() => {
    AOS.init({
      once: true,
      disable: "phone",
      duration: 700,
      easing: "ease-out-cubic",
    });
  });

  return (
    <>
      <Header />
      <Hero />
      <FeaturesPlanet />
      <LargeTestimonial />
      <Footer />
    </>
  );
}
