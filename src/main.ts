import { createIcons, Drum, Piano, Keyboard, Volume2, Music } from 'lucide'
import './style.css'

// ---------- Web Audio (synth only, no samples) ----------
let ctx: AudioContext | null = null
let noiseBuf: AudioBuffer | null = null
function audio(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
    const len = ctx.sampleRate * 1.5
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}
function noise(dur: number, filterType: BiquadFilterType, freq: number, gainVal: number, q = 1) {
  const ac = audio(); const t = ac.currentTime
  const src = ac.createBufferSource(); src.buffer = noiseBuf
  const f = ac.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q
  const g = ac.createGain()
  g.gain.setValueAtTime(gainVal, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  src.connect(f); f.connect(g); g.connect(ac.destination)
  src.start(t); src.stop(t + dur)
}
function tone(type: OscillatorType, f0: number, f1: number, dur: number, gainVal: number) {
  const ac = audio(); const t = ac.currentTime
  const o = ac.createOscillator(); o.type = type
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur)
  const g = ac.createGain()
  g.gain.setValueAtTime(gainVal, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur)
}
const drumSounds: Record<string, () => void> = {
  kick: () => { tone('sine', 160, 48, 0.28, 0.95); noise(0.02, 'highpass', 4000, 0.25) },
  snare: () => { noise(0.16, 'bandpass', 1800, 0.7, 0.8); tone('triangle', 190, 120, 0.09, 0.4) },
  hihat: () => noise(0.055, 'highpass', 8200, 0.42),
  tomHigh: () => tone('sine', 210, 110, 0.28, 0.65),
  tomMid: () => tone('sine', 165, 85, 0.32, 0.65),
  floorTom: () => tone('sine', 120, 55, 0.4, 0.7),
  crash: () => { noise(1.4, 'highpass', 5200, 0.55); noise(0.9, 'bandpass', 9000, 0.3, 2) },
  ride: () => { noise(0.7, 'highpass', 6800, 0.32); tone('square', 6200, 6100, 0.18, 0.05); tone('square', 8400, 8300, 0.12, 0.04) },
}


// ---------- Piano (synth: harmonics + decay envelope) ----------
type Note = { name: string; midi: number; black: boolean; keyLabel: string; kb: string }
const NOTES: Note[] = []
const NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
// chromatic keyboard mapping starting at C4: a w s e d f t g y h u j k o l p ; ' (C5..) then z row is not used
const KB = ['a','w','s','e','d','f','t','g','y','h','u','j','k','o','l','p',';',"'",'[']
let kbIdx = 0
for (let midi = 60; midi <= 84; midi++) { // C4..C6 = 2 octaves + top C
  const name = NAMES[midi % 12] + String(Math.floor(midi / 12) - 1)
  const black = name.includes('#')
  NOTES.push({ name, midi, black, keyLabel: (KB[kbIdx] || '').toUpperCase(), kb: KB[kbIdx] || '' }); kbIdx++
}
function playPiano(midi: number) {
  const ac = audio(); const t = ac.currentTime
  const freq = 440 * Math.pow(2, (midi - 69) / 12)
  const master = ac.createGain(); const lp = ac.createBiquadFilter()
  lp.type = 'lowpass'; lp.frequency.value = 4200
  master.gain.setValueAtTime(0.0001, t)
  master.gain.exponentialRampToValueAtTime(0.55, t + 0.008)
  master.gain.exponentialRampToValueAtTime(0.0001, t + 2.4)
  lp.connect(master); master.connect(ac.destination)
  ;[[1, 1], [2, 0.42], [3, 0.18], [4, 0.07]].forEach(([mult, amt]) => {
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = freq * (mult as number)
    const g = ac.createGain(); g.gain.value = amt as number
    o.connect(g); g.connect(lp); o.start(t); o.stop(t + 2.4)
  })
}

// ---------- UI ----------
type Pad = { id: string; label: string; sub: string; keyLabel: string; keys: string[]; kind: string; style: string }
const pads: Pad[] = [
  { id: 'crash', label: 'Crash', sub: 'クラッシュ', keyLabel: 'Q', keys: ['q'], kind: 'cymbal cymbal-lg', style: 'left:6%;top:4%;width:24%' },
  { id: 'ride', label: 'Ride', sub: 'ライド', keyLabel: 'E', keys: ['e'], kind: 'cymbal cymbal-lg', style: 'right:6%;top:4%;width:24%' },
  { id: 'hihat', label: 'Hi-Hat', sub: 'ハイハット', keyLabel: 'A', keys: ['a'], kind: 'cymbal', style: 'left:2%;top:34%;width:20%' },
  { id: 'tomHigh', label: 'Tom 1', sub: 'ハイタム', keyLabel: 'S', keys: ['s'], kind: 'drum tom', style: 'left:31%;top:26%;width:17%' },
  { id: 'tomMid', label: 'Tom 2', sub: 'ロータム', keyLabel: 'D', keys: ['d'], kind: 'drum tom', style: 'right:31%;top:26%;width:17%' },
  { id: 'snare', label: 'Snare', sub: 'スネア', keyLabel: 'F', keys: ['f'], kind: 'drum snare', style: 'left:16%;top:56%;width:21%' },
  { id: 'floorTom', label: 'Floor Tom', sub: 'フロアタム', keyLabel: 'J', keys: ['j'], kind: 'drum tom floor', style: 'right:13%;top:54%;width:22%' },
  { id: 'kick', label: 'Kick', sub: 'キック', keyLabel: 'Space / K', keys: [' ', 'k'], kind: 'drum kick', style: 'left:50%;top:52%;width:26%;transform:translateX(-50%)' },
]

const app = document.querySelector<HTMLElement>('#app')!
app.innerHTML = `
<div class="stage min-h-screen text-zinc-100">
  <header class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 pt-6">
    <div class="flex items-center gap-3">
      <span class="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/15 text-amber-300"><i data-lucide="music" class="h-5 w-5"></i></span>
      <div><h1 class="text-xl font-bold tracking-wide">DrumPiano</h1><p class="text-xs text-zinc-400">クリック / タップ / キーボードで鳴らせる楽器</p></div>
    </div>
    <p class="flex items-center gap-2 text-xs text-zinc-400"><i data-lucide="volume-2" class="h-4 w-4"></i>音は Web Audio API の合成音のみ（外部サンプルなし）</p>
  </header>

  <nav class="mx-auto mt-6 flex max-w-5xl justify-center px-5" aria-label="楽器切替">
    <div class="inline-flex rounded-full border border-white/10 bg-white/5 p-1" role="tablist">
      <button id="tab-drums" role="tab" aria-selected="true" class="tab-btn is-active"><i data-lucide="drum" class="h-4 w-4"></i>ドラム</button>
      <button id="tab-piano" role="tab" aria-selected="false" class="tab-btn"><i data-lucide="piano" class="h-4 w-4"></i>ピアノ</button>
    </div>
  </nav>

  <main class="mx-auto max-w-5xl px-5 pb-14">
    <section id="panel-drums" class="mt-6">
      <div class="kit" role="group" aria-label="ドラムキット（ドラマーの視点）">
        <div class="kit-floor"></div>
        ${pads.map(p => `
          <button class="pad ${p.kind}" style="${p.style}" data-drum="${p.id}" aria-label="${p.sub}">
            <span class="pad-face"><span class="pad-label">${p.label}</span><span class="pad-sub">${p.sub}</span><span class="pad-key">${p.keyLabel}</span></span>
          </button>`).join('')}
      </div>
      <p class="mt-4 flex flex-wrap items-center justify-center gap-2 text-center text-xs text-zinc-400">
        <i data-lucide="keyboard" class="h-4 w-4"></i>
        キーボード： Q クラッシュ / A ハイハット / S・D タム / F スネア / Space・K キック / J フロアタム / E ライド
      </p>
    </section>

    <section id="panel-piano" class="mt-6 hidden">
      <div class="piano-wrap">
        <div id="beams" class="beams" aria-hidden="true"></div>
        <div id="keyboard" class="keyboard" role="group" aria-label="ピアノ鍵盤">
          ${NOTES.filter(n => !n.black).map(n => `<button class="wkey" data-midi="${n.midi}" aria-label="${n.name}"><span class="wkey-name">${n.name}</span><span class="wkey-kb">${n.keyLabel}</span></button>`).join('')}
          ${NOTES.filter(n => n.black).map(n => {
            // black key sits between previous white key and next: position by count of white keys before it
            const whitesBefore = NOTES.filter(x => x.midi < n.midi && !x.black).length
            const totalWhites = NOTES.filter(x => !x.black).length
            const left = (whitesBefore / totalWhites) * 100
            return `<button class="bkey" style="left:${left}%" data-midi="${n.midi}" aria-label="${n.name}"><span class="bkey-kb">${n.keyLabel}</span></button>`
          }).join('')}
        </div>
      </div>
      <p class="mt-4 flex flex-wrap items-center justify-center gap-2 text-center text-xs text-zinc-400">
        <i data-lucide="keyboard" class="h-4 w-4"></i>
        キーボード： A が C4（ド）、半音は W E T Y U O P。鍵を叩くと光が上へ伸びます。
      </p>
    </section>
  </main>
  <footer class="pb-6 text-center text-[11px] text-zinc-600">Git_DrumPiano — Stage dark theme / Responsive</footer>
</div>`

createIcons({ icons: { Drum, Piano, Keyboard, Volume2, Music } })

// tabs
const tabDrums = document.querySelector('#tab-drums')!
const tabPiano = document.querySelector('#tab-piano')!
const panelDrums = document.querySelector('#panel-drums')!
const panelPiano = document.querySelector('#panel-piano')!
let switchTab = function (which: 'drums' | 'piano') {
  const drums = which === 'drums'
  tabDrums.classList.toggle('is-active', drums); tabPiano.classList.toggle('is-active', !drums)
  tabDrums.setAttribute('aria-selected', String(drums)); tabPiano.setAttribute('aria-selected', String(!drums))
  panelDrums.classList.toggle('hidden', !drums); panelPiano.classList.toggle('hidden', drums)
}
tabDrums.addEventListener('click', () => switchTab('drums'))
tabPiano.addEventListener('click', () => switchTab('piano'))

// drum hits
function hit(id: string) {
  drumSounds[id]?.()
  const el = document.querySelector(`[data-drum="${id}"]`)
  if (el) { el.classList.remove('hit'); void (el as HTMLElement).offsetWidth; el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 180) }
}
document.querySelectorAll('[data-drum]').forEach(el => el.addEventListener('pointerdown', () => hit((el as HTMLElement).dataset.drum!)))
window.addEventListener('keydown', (e) => {
  if (e.repeat) return
  const p = pads.find(x => x.keys.includes(e.key.toLowerCase()))
  if (p && !panelDrums.classList.contains('hidden')) { e.preventDefault(); hit(p.id) }
})


// piano hits + light beams
let currentTab: 'drums' | 'piano' = 'drums'
const _switch = switchTab
switchTab = function (which: 'drums' | 'piano') { currentTab = which; _switch(which) }
tabDrums.addEventListener('click', () => { currentTab = 'drums' })
tabPiano.addEventListener('click', () => { currentTab = 'piano' })

function hitPiano(midi: number, el: HTMLElement | null) {
  playPiano(midi)
  if (el) { el.classList.remove('pressed'); void el.offsetWidth; el.classList.add('pressed'); setTimeout(() => el.classList.remove('pressed'), 260) }
  const keyEl = el ?? document.querySelector(`[data-midi="${midi}"]`)
  const beams = document.querySelector('#beams') as HTMLElement | null
  const kb = document.querySelector('#keyboard') as HTMLElement | null
  if (keyEl && beams && kb) {
    const kr = kb.getBoundingClientRect(); const r = (keyEl as HTMLElement).getBoundingClientRect()
    const beam = document.createElement('span')
    beam.className = 'beam' + ((keyEl as HTMLElement).classList.contains('bkey') ? ' beam-black' : '')
    beam.style.left = `${r.left - kr.left + r.width / 2}px`
    beams.appendChild(beam)
    setTimeout(() => beam.remove(), 950)
  }
}
document.querySelectorAll('[data-midi]').forEach(el => el.addEventListener('pointerdown', () => hitPiano(Number((el as HTMLElement).dataset.midi), el as HTMLElement)))
window.addEventListener('keydown', (e) => {
  if (e.repeat || currentTab !== 'piano') return
  const n = NOTES.find(x => x.kb && x.kb === e.key.toLowerCase())
  if (n) { e.preventDefault(); hitPiano(n.midi, null) }
})
