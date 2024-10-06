import Image from "next/image";

import { Header } from "@/components/header";
// import { Chat } from "@/components/chat";
import { HomePageComponent } from "@/components/home";

export default function Home() {
  return (
    <>
      <Header />
      <HomePageComponent />
    </>
  );
}
