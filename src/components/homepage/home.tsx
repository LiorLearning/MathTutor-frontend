"use client";

import { useEffect } from "react";

import AOS from "aos";
import "aos/dist/aos.css";

import Hero from "./hero-home";
import FeaturesPlanet from "./features-planet";
import LargeTestimonial from "./large-testimonial";
import Header from "./header";
import About from "./about";
import Footer from "./footer";

export default function Home() {
  const color = "#c197db";

  useEffect(() => {
    AOS.init({
      once: true,
      disable: "phone",
      duration: 700,
      easing: "ease-out-cubic",
    });
  }, []);

  return (
    <>
      <Header color={color} />
      <Hero color={color} />
      <FeaturesPlanet />
      <LargeTestimonial />
      <About />
      <Footer />
    </>
  );
}
