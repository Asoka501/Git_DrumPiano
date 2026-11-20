import { createIcons, Rocket } from 'lucide'
import './style.css'

const app = document.querySelector<HTMLElement>('#app')
if (app) {
  app.innerHTML = `
    <section class="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <i data-lucide="rocket" class="h-10 w-10"></i>
      <h1 class="text-3xl font-bold">DrumPiano</h1>
      <p class="text-slate-600">Vite + TypeScript + Tailwind CSS + Lucide の標準構成で起動しています。</p>
    </section>
  `
}

createIcons({ icons: { Rocket } })
