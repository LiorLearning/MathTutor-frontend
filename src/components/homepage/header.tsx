// import Link from "next/link";
import { DarkModeToggle } from "@/components/themeContext";

export default function Header() {
  return (
    <header className="fixed top-2 z-30 w-full md:top-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative flex h-14 items-center justify-between gap-3 rounded-2xl bg-muted px-3 shadow-lg shadow-black/[0.03] backdrop-blur-sm before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(var(--muted),var(--muted-foreground))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]">
          {/* Site branding */}
          <div className="flex flex-1 items-center">
            {/* <Logo /> */}
            <span className="ml-3 text-xl font-bold text-foreground">Lior Learning</span>
          </div>

          {/* Desktop sign in links */}
          <ul className="flex flex-1 items-center justify-end gap-3">
            {/* <li>
              <Link
                href=""
                className="btn-sm"
              >
                Sign In
              </Link>
            </li>
            <li>
              <Link
                href=""
                className="btn-sm"
              >
                Get Started
              </Link>
            </li> */}
            <li>
              <DarkModeToggle />
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
