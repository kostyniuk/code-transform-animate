import Image from "next/image";

export async function Header() {
  'use cache'

  return (
    <header className="flex-none h-14 border-b flex items-center justify-between px-4 bg-background z-20">
      <div className="flex items-center gap-2">
        <Image
          src="/favicon.svg"
          alt="Mellow Lines"
          width={24}
          height={24}
        />
        <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Mellow Lines
        </h1>
      </div>
    </header>
  );
}

