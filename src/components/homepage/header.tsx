import { DarkModeToggle } from "@/components/themeContext";

export default function Header({ color }: { color: string }) {
  return (
    <header className="fixed top-2 z-30 w-full md:top-6" style={{ color: `${color} !important`, backgroundColor: 'transparent !important' }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative flex h-14 items-center justify-between gap-3 rounded-2xl px-3 shadow-xl shadow-black/[0.1] backdrop-blur-md">
          {/* Site branding */}
          <div className="flex flex-1 items-center" style={{ color: `${color} !important` }}>
            {/* <Logo /> */}
            <span className="ml-3 text-[1.2rem] font-bold" style={{ color: `${color} !important` }}>Lior AI</span>
          </div>
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
}