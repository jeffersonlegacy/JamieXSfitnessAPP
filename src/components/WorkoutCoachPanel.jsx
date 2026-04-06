import { useState } from 'react'
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

export default function WorkoutCoachPanel({
  setupCue,
  modificationCue,
  overloadCue,
  details,
  defaultOpen = false,
  title = 'A little help for today',
  detailsLabel = 'More support',
}) {
  const [showDetails, setShowDetails] = useState(defaultOpen)

  return (
    <section className="rounded-[28px] border border-white/8 bg-[linear-gradient(145deg,rgba(255,143,200,0.12),rgba(141,103,255,0.07)_58%,rgba(255,255,255,0.03))] p-5 text-white shadow-[0_18px_54px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/48">
            <Sparkles size={14} className="text-blush-200" />
            Jamie-first coaching
          </div>
          <h3 className="mt-3 text-[1.35rem] font-extrabold leading-[1.02] tracking-[-0.03em]">
            {title}
          </h3>
        </div>
        <button
          className="rounded-full border border-white/10 bg-white/6 p-3 text-gold-300"
          onClick={() => setShowDetails((current) => !current)}
          type="button"
        >
          {showDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      <div className="mt-5 grid gap-3">
        <CueBlock label="Set up" text={setupCue} />
        <CueBlock label="Make it fit you" text={modificationCue} />
        <CueBlock label="Progress with care" text={overloadCue} />
      </div>

      {details ? (
        <div className="mt-4">
          <button
            className="text-left text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/48"
            onClick={() => setShowDetails((current) => !current)}
            type="button"
          >
            {detailsLabel}
          </button>

          {showDetails ? (
            <div className="mt-3 rounded-[20px] border border-white/8 bg-white/[0.04] p-4 text-[13px] leading-7 text-white/72">
              {details}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

function CueBlock({ label, text }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-4">
      <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/46">
        {label}
      </div>
      <p className="mt-2 text-[14px] leading-7 text-white/82">{text}</p>
    </div>
  )
}
