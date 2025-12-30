import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { ArrowRight, Wand2, Video, Layers, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GitHubIcon, TwitterIcon } from '@/components/ui/icons';

export default function Page() {
    return (
        <div className="relative w-full h-full flex flex-col">
            {/* Background Layer - Grid Pattern */}
            <div className="fixed inset-0 z-0 bg-background bg-[url('/grid-pattern.svg')] dark:bg-[url('/grid-pattern-dark.svg')] bg-center" />

            <div className="relative z-10 flex-1 flex flex-col min-h-0">
                <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
                    <div className="flex flex-col lg:flex-row gap-8 items-center flex-1">
                        {/* Hero Text - Left Column */}
                        <div className="text-left space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 flex-1">
                            <div className="flex justify-start">
                                <Badge variant="secondary" className="text-sm rounded-full bg-background/50 backdrop-blur-md border border-border">
                                    ✨ v1.0 Public Beta
                                </Badge>
                            </div>

                            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground drop-shadow-sm leading-[1.1]">
                                Transform Code <br />
                                into <span className="text-primary inline-block decoration-primary/30 underline decoration-wavy decoration-2 underline-offset-4">Motion</span>
                            </h1>

                            <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-xl leading-relaxed">
                                Create stunning, cinematic code walkthroughs in seconds.
                                The ultimate storytelling tool for developers.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-start pt-4">
                                <Link href="/editor">
                                    <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/20 transition-transform hover:scale-105">
                                        Open Editor <ArrowRight className="ml-2 w-5 h-5" />
                                    </Button>
                                </Link>
                                <Link href="https://github.com/kostyniuk/mellow-lines" target="_blank">
                                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full bg-background/40 backdrop-blur-md border border-border hover:bg-background/60 transition-transform hover:scale-105 hover:text-primary">
                                        Star on GitHub
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Hero Video Demo - Right Column */}
                        <div className="w-full lg:flex-1 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 fill-mode-backwards">
                            <div className="relative rounded-xl border border-border bg-card/50 dark:bg-white/5 shadow-2xl backdrop-blur-sm overflow-hidden ring-1 ring-black/5 dark:ring-white/20">
                                <div className="absolute inset-0 bg-primary/20 mix-blend-overlay z-10 pointer-events-none" />
                                <video
                                    src="/demo_slow.mp4"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    className="w-full h-auto rounded-xl"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Features Preview */}
                    <div className="flex flex-wrap gap-4 mt-12 w-full max-w-6xl animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300 fill-mode-backwards">
                        <FeatureCard
                            icon={<Wand2 className="w-5 h-5 text-primary" />}
                            title="Magic Transitions"
                            description="Automatically analyze and animate code diffs with smooth, cinematic movement."
                        />
                        <FeatureCard
                            icon={<Video className="w-5 h-5 text-primary" />}
                            title="High-Quality Export"
                            description="Render blazing fast, high-quality MP4 & WebM videos ready for social media."
                        />
                        <FeatureCard
                            icon={<Layers className="w-5 h-5 text-primary" />}
                            title="Rich Theming"
                            description="Select from a vast library of syntax themes and fonts to match your brand."
                        />
                        <FeatureCard
                            icon={<Play className="w-5 h-5 text-primary" />}
                            title="Real-Time Preview"
                            description="See your animation come to life instantly with live preview and timeline scrubbing."
                        />
                    </div>
                </div>
            </div>

            {/* Simple Footer */}
            <footer className="relative z-10 flex-shrink-0 h-14 flex items-center justify-center text-center text-muted-foreground text-sm bg-background/60 backdrop-blur-xl border-t border-border">
                <div className="container mx-auto flex items-center justify-center gap-4">
                    <p>© 2025 mellowlines. All rights reserved.</p>
                    <div className="flex items-center gap-3">
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
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <Card className="w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)] bg-card/50 backdrop-blur-xl border border-border hover:border-primary/50 transition-colors duration-300 shadow-sm">
            <CardHeader className="pb-3">
                <div className="mb-2 p-2 bg-primary/10 rounded-lg w-fit ring-1 ring-primary/20">
                    {icon}
                </div>
                <CardTitle className="text-lg font-semibold tracking-tight">{title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <CardDescription className="text-sm leading-relaxed">
                    {description}
                </CardDescription>
            </CardContent>
        </Card>
    )
}