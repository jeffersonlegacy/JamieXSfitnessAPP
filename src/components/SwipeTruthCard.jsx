import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

const HOLD_DELAY_MS = 280
const SWIPE_THRESHOLD = 64

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function buildBurst(type) {
  const glyphs =
    type === 'liked'
      ? ['🩷', '💖', '💕', '💗', '💞', '🫶']
      : ['💀', '☠️', '🦴', '💀', '☠️', '🖤']

  return Array.from({ length: 9 }, (_, index) => ({
    id: `${type}-${Date.now()}-${index}`,
    glyph: glyphs[index % glyphs.length],
    x: `${-78 + Math.random() * 156}px`,
    y: `${-22 - Math.random() * 118}px`,
    rotate: `${-28 + Math.random() * 56}deg`,
    delay: `${Math.random() * 90}ms`,
  }))
}

export default function SwipeTruthCard({ card, onReact, reaction }) {
  const [expanded, setExpanded] = useState(false)
  const [armed, setArmed] = useState(false)
  const [pressing, setPressing] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [bursts, setBursts] = useState([])
  const [statusMessage, setStatusMessage] = useState('')

  const holdTimerRef = useRef(null)
  const burstTimerRef = useRef(null)
  const pointerIdRef = useRef(null)
  const startYRef = useRef(0)
  const activeRef = useRef(false)

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current)
      if (burstTimerRef.current) window.clearTimeout(burstTimerRef.current)
    }
  }, [])

  const longBody = String(card.body || '').length > 150
  const body = expanded || !longBody ? card.body : shortenText(card.body, 148)
  const swipeIntent =
    dragOffset <= -SWIPE_THRESHOLD
      ? 'liked'
      : dragOffset >= SWIPE_THRESHOLD
        ? 'sensitive'
        : null

  const savedLabel =
    reaction === 'liked'
      ? 'Saved for Coach Kitty'
      : reaction === 'sensitive'
        ? 'Coach Kitty will go gently'
        : 'Hold, then drag'

  function clearHoldTimer() {
    if (!holdTimerRef.current) return
    window.clearTimeout(holdTimerRef.current)
    holdTimerRef.current = null
  }

  function resetInteraction() {
    clearHoldTimer()
    activeRef.current = false
    pointerIdRef.current = null
    setArmed(false)
    setPressing(false)
    setDragOffset(0)
  }

  function finishReaction(type) {
    setBursts(buildBurst(type))
    setStatusMessage(
      type === 'liked'
        ? 'Coach Kitty saved that truth.'
        : 'Coach Kitty will treat that one carefully.',
    )
    onReact(type)

    if (burstTimerRef.current) window.clearTimeout(burstTimerRef.current)
    burstTimerRef.current = window.setTimeout(() => {
      setBursts([])
    }, 900)
  }

  function handlePointerDown(event) {
    if (event.button && event.button !== 0) return

    activeRef.current = true
    pointerIdRef.current = event.pointerId
    startYRef.current = event.clientY
    setPressing(true)
    setStatusMessage('Press and hold. Then drag.')

    event.currentTarget.setPointerCapture?.(event.pointerId)

    clearHoldTimer()
    holdTimerRef.current = window.setTimeout(() => {
      if (!activeRef.current) return
      setArmed(true)
      setStatusMessage('Now drag up or down.')
    }, HOLD_DELAY_MS)
  }

  function handlePointerMove(event) {
    if (!activeRef.current || pointerIdRef.current !== event.pointerId) return
    if (!armed) return
    setDragOffset(clamp(event.clientY - startYRef.current, -126, 126))
  }

  function handlePointerEnd(event) {
    if (pointerIdRef.current !== null && pointerIdRef.current !== event.pointerId) return

    const nextReaction =
      armed && dragOffset <= -SWIPE_THRESHOLD
        ? 'liked'
        : armed && dragOffset >= SWIPE_THRESHOLD
          ? 'sensitive'
          : null

    event.currentTarget.releasePointerCapture?.(event.pointerId)
    resetInteraction()

    if (nextReaction) {
      finishReaction(nextReaction)
      return
    }

    setStatusMessage('')
  }

  return (
    <article
      className={clsx(
        'relative overflow-hidden rounded-[26px] border bg-[linear-gradient(160deg,rgba(255,86,163,0.2),rgba(255,255,255,0.04)_40%,rgba(10,8,13,0.92)_100%)] p-5 shadow-[0_18px_34px_rgba(0,0,0,0.24)] transition-transform duration-200',
        reaction === 'liked' && 'border-[#ff9fcb]/28',
        reaction === 'sensitive' && 'border-white/18',
        reaction === null && 'border-[#ff8ec8]/12',
        armed && 'cursor-grabbing',
        !armed && 'cursor-pointer',
      )}
      onContextMenu={(event) => event.preventDefault()}
      onPointerCancel={handlePointerEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      style={{
        transform:
          armed || pressing
            ? `translateY(${dragOffset}px) rotate(${dragOffset / 22}deg)`
            : undefined,
        touchAction: 'pan-x',
      }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[26px] border border-white/8" />
      <div className="flex items-center justify-between gap-3">
        <div className="micro-label text-blush-100">{card.category}</div>
        <div
          className={clsx(
            'rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em]',
            reaction === 'liked'
              ? 'border-[#ffbdd7]/16 bg-[#ff7ebf]/14 text-[#ffe8f2]'
              : reaction === 'sensitive'
                ? 'border-white/12 bg-white/[0.05] text-white/68'
                : 'border-white/10 bg-black/18 text-white/58',
          )}
        >
          {savedLabel}
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/44">
        <div
          className={clsx(
            'rounded-full border px-3 py-2 transition',
            swipeIntent === 'liked'
              ? 'border-[#ffb7d8]/24 bg-[#ff7ebf]/16 text-[#ffe4f1]'
              : 'border-white/8 bg-black/12',
          )}
        >
          Swipe up if this one hits
        </div>
        <div
          className={clsx(
            'rounded-full border px-3 py-2 transition',
            swipeIntent === 'sensitive'
              ? 'border-white/16 bg-white/[0.08] text-white'
              : 'border-white/8 bg-black/12',
          )}
        >
          Swipe down if you are not ready for it yet
        </div>
      </div>

      <h3 className="mt-4 text-lg font-extrabold text-white">{card.title}</h3>
      <p className="mt-3 text-[14px] leading-7 text-white/76">{body}</p>
      {longBody ? (
        <button
          className="mt-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-blush-200"
          onClick={(event) => {
            event.stopPropagation()
            setExpanded((current) => !current)
          }}
          onPointerDown={(event) => event.stopPropagation()}
          type="button"
        >
          {expanded ? 'Show less' : 'Read the rest'}
        </button>
      ) : null}

      <div className="mt-4 rounded-[18px] border border-white/8 bg-black/18 p-3 text-[13px] leading-6 text-white/82">
        <span className="font-bold text-gold-300">Use this:</span> {card.takeaway}
      </div>

      <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white/38">
        {statusMessage || 'Press and hold first. Then drag.'}
      </div>

      {bursts.length ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {bursts.map((burst) => (
            <span
              className="truth-burst-emoji"
              key={burst.id}
              style={{
                '--truth-burst-x': burst.x,
                '--truth-burst-y': burst.y,
                '--truth-burst-rotate': burst.rotate,
                animationDelay: burst.delay,
              }}
            >
              {burst.glyph}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  )
}

function shortenText(value, maxLength) {
  const text = String(value || '').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trim()}…`
}
