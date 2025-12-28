# Mellow Lines

Code animation studio built with Next.js that transforms your code snippets into beautiful, smooth transition animations. Perfect for creating high-quality videos of code refactorings, feature implementations, or explaining complex logic.

## ✨ Features

- **Magical Transitions**: Smoothly animate code changes between multiple steps using a custom layout engine.
- **Shiki Integration**: High-fidelity syntax highlighting powered by Shiki with support for various themes.
- **High-Performance Rendering**: Direct-to-canvas 2D rendering ensures sharp visuals and fluid 60 FPS animations.
- **Video Export**: Export your animations directly to high-quality MP4 or WebM formats using FFmpeg (WASM).
- **Interactive Studio**: Real-time preview with timeline seeking, play/pause controls, and customizable transition timings.
- **Customizable**: Toggle line numbers, adjust FPS, change themes, and more.

## 🚀 Getting Started

First, install the dependencies:

```bash
npm install
# or
bun install
```

Then, run the development server:

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Highlighter**: [Shiki](https://shiki.style/)
- **Graphics**: HTML5 Canvas 2D API
- **Video Processing**: [@ffmpeg/ffmpeg](https://ffmpegwasm.netlify.app/) (WebAssembly)

## 📖 Learn More

To learn more about the internals of the animation engine, check out:
- `app/lib/magicMove/`: The core logic for token selection and layout animation.
- `app/lib/video/`: Video recording and FFmpeg conversion logic.

