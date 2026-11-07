import type { Lead } from "@/lib/answers"

/** The two-sentence answer that opens every Class, Studio and Craft page. Keep it first after the H1. */
export function AnswerLead({ lead }: { lead: Lead }) {
  return (
    <p data-answer-lead className="mt-3 text-base text-cream leading-relaxed max-w-2xl">
      {lead.headline} <span className="text-cream-soft">{lead.detail}</span>
    </p>
  )
}
