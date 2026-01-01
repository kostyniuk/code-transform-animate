import Image from "next/image";
import { ThemeToggle } from "./theme-toggle";
import Link from "next/link";
import { GitHubIcon, TwitterIcon } from "./ui/icons";
import { Separator } from "./ui/separator";

export async function Header() {
  return (
    <header className="flex-none h-14 border-b flex items-center justify-between px-4 bg-background z-20">
      <Link href="/">
        <div className="flex items-center gap-2">
          <Image src="/favicon.svg" alt="Mellow Lines" width={24} height={24} />
          <h1 className="text-lg font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Mellow Lines
          </h1>
        </div>
      </Link>
      <div className="flex items-center gap-4">
        <a
          href="https://github.com/kostyniuk/mellow-lines"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="GitHub"
        >
          <GitHubIcon className="w-4 h-4" />
        </a>
        <a
          href="https://x.com/costiniuc00"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Twitter"
        >
          <TwitterIcon className="w-4 h-4" />
        </a>
        <Separator orientation="vertical" className="" />
        <ThemeToggle />
      </div>
    </header>
  );
}
