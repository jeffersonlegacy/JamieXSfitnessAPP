import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, PlayCircle } from 'lucide-react'

function getVimeoEmbedUrl(videoUrl) {
  if (!videoUrl) return ''

  const raw = String(videoUrl).trim()

  const directMatch = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/i)
  if (directMatch?.[1]) {
    return `https://player.vimeo.com/video/${directMatch[1]}?title=0&byline=0&portrait=0`
  }

  const playerMatch = raw.match(/player\.vimeo\.com\/video\/(\d+)/i)
  if (playerMatch?.[1]) {
    return `https://player.vimeo.com/video/${playerMatch[1]}?title=0&byline=0&portrait=0`
  }

  return raw
}

export default function WorkoutPlayer({
  title = "Today's workout",
  subtitle = 'Open the workout when you are ready and keep the pace that feels right for your body.',
  videoUrl,
  defaultOpen = true,
  badge = 'Workout',
  helper = '',
  isOpen: controlledOpen,
  onOpenChange,
  status = '',
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const embedUrl = useMemo(() => getVimeoEmbedUrl(videoUrl), [videoUrl])
  const open = typeof controlledOpen === 'boolean' ? controlledOpen : isOpen

  function handleToggle() {
    const next = !open
    if (typeof controlledOpen !== 'boolean') {
      setIsOpen(next)
    }
    onOpenChange?.(next)
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(32,21,35,0.94),rgba(21,15,24,0.98))] text-white shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
      <button
        className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left"
        onClick={handleToggle}
        type="button"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/48">
              {badge}
            </div>
            {status ? (
              <span className="inline-flex min-h-7 items-center rounded-full border border-white/10 bg-white/6 px-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-gold-300">
                {status}
              </span>
            ) : null}
          </div>
          <h2 className="mt-3 text-[1.65rem] font-extrabold leading-[0.95] tracking-[-0.04em]">
            {title}
          </h2>
          <p className="mt-3 text-[14px] leading-7 text-white/72">{subtitle}</p>
          {helper ? (
            <p className="mt-3 text-[12px] font-bold uppercase tracking-[0.16em] text-white/42">
              {helper}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 rounded-full border border-white/10 bg-white/6 p-3 text-gold-300">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {open ? (
        <div className="px-5 pb-5">
          {embedUrl ? (
            <div className="overflow-hidden rounded-[24px] border border-white/8 bg-black/30">
              <div className="relative aspect-video w-full">
                <iframe
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  src={embedUrl}
                  title={title}
                />
              </div>
            </div>
          ) : (
            <div className="flex min-h-[220px] items-center justify-center rounded-[24px] border border-dashed border-white/12 bg-white/4 px-5 text-center">
              <div>
                <PlayCircle className="mx-auto text-blush-200" size={34} />
                <p className="mt-3 text-sm leading-6 text-white/72">
                  Add a Vimeo link and the player will appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="px-5 pb-5">
          <div className="flex items-center gap-3 rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-4">
            <div className="rounded-full border border-white/10 bg-white/8 p-3 text-gold-300">
              <PlayCircle size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">Ready when you are</p>
              <p className="mt-1 text-[13px] leading-6 text-white/62">
                Tap open when you want to start the session.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
