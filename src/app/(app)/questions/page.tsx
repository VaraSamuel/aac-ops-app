const SALES_QUESTIONS = [
  "What software do you run day to day?",
  "Where does your team waste the most time?",
  "What still gets done by hand that probably shouldn't?",
  "What tasks does your team hate and keep redoing by hand?",
];

const DEEP_DIVE_QUESTIONS = [
  "Walk me through this workflow step by step, from trigger to completion. What starts it? What ends it?",
  "Where do mistakes happen? What does a mistake cost you — in time and in consequence?",
  "Have you ever tried to improve this? What happened?",
  "Is there a tool that is supposed to handle this but doesn't quite work?",
];

const ROLE_QUESTIONS = [
  "Walk me through a typical day. What are the first three things you do when you sit down?",
  "Which tasks take up the most of your time each week — not the most important, just the most time?",
  "Are there any tasks you dread because they are repetitive, slow, or error-prone?",
];

export default function QuestionsPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Discovery Questions</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Two different question sets, for two different moments — verbatim from AI Analytics Console&apos;s own training materials.
        </p>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 text-sm text-indigo-900 mb-8">
        <strong>Use the right one at the right time:</strong> the Sales Call questions are for before a prospect
        has paid anything — short, informal, meant to surface enough pain to justify booking a paid Assessment.
        The Workflow Interview Guide is the actual paid-Assessment script, run per staff member, 35–45 minutes each.
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-neutral-900 mb-1">1. Sales / Qualifying Call — before they've paid</h2>
        <p className="text-xs text-neutral-500 mb-4">
          Source: Partner Training Manual &amp; Partner Key Qualities. Short and informal — the goal is to surface
          one or two real pain points, not to run the full Assessment for free.
        </p>
        <ul className="space-y-2">
          {SALES_QUESTIONS.map((q, i) => (
            <li key={i} className="flex gap-3 text-sm text-neutral-800">
              <span className="text-indigo-500 font-medium shrink-0">{i + 1}.</span>
              <span>&ldquo;{q}&rdquo;</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-neutral-400 mt-4 italic">
          Per the Partner Key Qualities doc: &ldquo;The single most useful question in this business&rdquo; is #4.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-neutral-900 mb-1">2. Workflow Interview Guide — the paid Assessment script</h2>
        <p className="text-xs text-neutral-500 mb-4">
          Internal workflow interview script, never shown to the client. Run once
          per interviewee, 35–45 minutes.
        </p>

        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-1">Opening (consent)</p>
            <p className="text-sm text-neutral-700 italic">
              &ldquo;This session will be recorded for note-taking purposes only. The recording will not be shared
              outside AI Analytics Console. Do you consent to recording?&rdquo;
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-1">Session framing</p>
            <p className="text-sm text-neutral-700 italic">
              &ldquo;Today I want to understand how your day-to-day work actually operates... We&apos;re looking
              for the repetitive, time-consuming tasks that a smarter system might be able to handle. Nothing you
              say is wrong. There are no trick questions.&rdquo;
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-2">Section B — Role &amp; daily tasks</p>
            <ul className="space-y-1.5">
              {ROLE_QUESTIONS.map((q, i) => (
                <li key={i} className="text-sm text-neutral-800">
                  <span className="text-indigo-500 font-medium">{i + 1}.</span> &ldquo;{q}&rdquo;
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-2">Section C — Workflow inventory probes</p>
            <p className="text-sm text-neutral-700">
              &ldquo;Is there anything you do the same way every time?&rdquo; · &ldquo;What do you do when a new
              matter comes in?&rdquo; · &ldquo;Any end-of-week routines?&rdquo;
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-2">
              Section D — Deep-dive (per top 2–3 workflows)
            </p>
            <ul className="space-y-1.5">
              {DEEP_DIVE_QUESTIONS.map((q, i) => (
                <li key={i} className="text-sm text-neutral-800">
                  <span className="text-indigo-500 font-medium">{i + 1}.</span> &ldquo;{q}&rdquo;
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-1">Section E — Tool audit</p>
            <p className="text-sm text-neutral-700 italic">
              &ldquo;Are there any tools the firm pays for but rarely or never uses?&rdquo;
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-1">
              Section F — AI readiness (rate 1–5)
            </p>
            <p className="text-sm text-neutral-700">
              Comfort learning new tools · Confidence after a 20-minute training · Concern about AI accuracy ·
              Concern about data security
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-1">Section G — Close</p>
            <p className="text-sm text-neutral-700 italic mb-1">
              &ldquo;To confirm — you spend approximately [X] hours per week on [WORKFLOW NAME]. Is that number
              right, or should we adjust it?&rdquo;
            </p>
            <p className="text-sm text-neutral-700 italic">
              &ldquo;That&apos;s everything I need from you today. I&apos;ll have the full findings and
              recommendations in the Assessment Report within 10 business days. Is there anything you want me to
              make sure I capture that we haven&apos;t covered?&rdquo;
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-neutral-400">
        Tip: after running this on a client, paste your notes into that client&apos;s Assessment Copilot — it will
        extract candidate workflows and draft scores automatically.
      </p>
    </div>
  );
}
