"use client";

import { useState, useTransition } from "react";
import { analyzeNotesAction, addWorkflow } from "@/lib/actions";
import { useSpeechToText } from "@/lib/useSpeechToText";
import { CAPABILITY_LABELS, tailoredDeepDiveQuestions, type ExtractedWorkflow } from "@/lib/capabilities";
import { compositeScore, indicatedTier } from "@/lib/scoring";

export function AssessmentCopilot({
  clientId,
  existingCapabilityTags,
}: {
  clientId: string;
  existingCapabilityTags: string[];
}) {
  const [notes, setNotes] = useState("");
  const [candidates, setCandidates] = useState<ExtractedWorkflow[]>([]);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [analyzed, setAnalyzed] = useState(false);

  const alreadyTracked = new Set(existingCapabilityTags);

  const { isRecording, interimText, isSupported, errorMessage, start, stop } = useSpeechToText((finalText) => {
    setNotes((prev) => (prev ? prev.trim() + " " : "") + finalText);
  });

  const handleAnalyze = () => {
    startTransition(async () => {
      const results = await analyzeNotesAction(clientId, notes);
      setCandidates(results);
      setAdded(new Set());
      setAnalyzed(true);
    });
  };

  const handleAdd = (w: ExtractedWorkflow) => {
    startTransition(async () => {
      await addWorkflow(clientId, w);
      setAdded((prev) => new Set(prev).add(w.capabilityTag));
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="text-sm font-semibold text-neutral-900">Assessment Copilot</h2>
        {isSupported && (
          <button
            type="button"
            onClick={isRecording ? stop : start}
            className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition ${
              isRecording
                ? "bg-red-50 text-red-700 hover:bg-red-100"
                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-indigo-500"}`} />
            {isRecording ? "Stop recording" : "Record notes"}
          </button>
        )}
      </div>
      <p className="text-xs text-neutral-500 mb-4">
        Paste raw interview notes from the Assessment, or record them live. The copilot flags candidate workflows
        and drafts scores — review and add the ones that are real before they become part of the record.
      </p>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={6}
        placeholder="e.g. The front desk gets constantly interrupted by missed calls during busy hours. Reservations and no-shows are tracked in a spreadsheet — deposits aren't collected consistently, so no-shows are a real revenue leak. Daily sales reconciliation between the POS and QuickBooks is manual and takes about an hour every night..."
        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
      {isRecording && (
        <p className="text-xs text-neutral-400 italic mt-1.5">
          Listening… {interimText && <span className="text-neutral-600">&ldquo;{interimText}&rdquo;</span>}
        </p>
      )}
      {!isSupported && (
        <p className="text-xs text-neutral-400 mt-1.5">
          Voice input isn&apos;t supported in this browser — try Chrome or Edge.
        </p>
      )}
      {errorMessage && <p className="text-xs text-red-600 mt-1.5">{errorMessage}</p>}

      <button
        onClick={handleAnalyze}
        disabled={isPending || notes.trim().length === 0}
        className="mt-3 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {isPending ? "Analyzing…" : "Analyze notes"}
      </button>

      {analyzed && (
        <div className="mt-5 border-t border-neutral-100 pt-5">
          {candidates.length === 0 ? (
            <p className="text-sm text-neutral-400">
              No known capability patterns matched in these notes. Try describing specific workflows (intake,
              reservations, reconciliation, missed calls, document drafting, reporting, etc.).
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} found
              </p>
              {candidates.map((c) => {
                const isAdded = added.has(c.capabilityTag);
                const isExisting = !isAdded && alreadyTracked.has(c.capabilityTag);
                const isDone = isAdded || isExisting;
                const composite = compositeScore(c);
                const tier = indicatedTier(composite);
                return (
                  <div key={c.capabilityTag} className="border border-neutral-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-neutral-900">{CAPABILITY_LABELS[c.capabilityTag]}</p>
                          {tier === "P1" && (
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700"
                              title="Composite indicates Priority 1, but the quality gate needs a confirmed compliant tool before it's final — answer that once it's added as a workflow."
                            >
                              Would be Priority 1 — tool not confirmed yet
                            </span>
                          )}
                          {isExisting && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">
                              Already tracked for this client
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 mt-1 italic">&ldquo;{c.sourceNotes}&rdquo;</p>
                        <div className="flex gap-3 mt-2 text-xs text-neutral-500">
                          <span>Frequency {c.frequencyScore}/5</span>
                          <span>Time Cost {c.timeBurdenScore}/5</span>
                          <span>Error Rate &amp; Risk {c.errorRiskScore}/5</span>
                          <span>AI Tool Availability {c.automationReadinessScore}/5</span>
                          <span className="font-medium text-neutral-700">Composite {composite}/20</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAdd(c)}
                        disabled={isPending || isDone}
                        title={isExisting ? "This client already has a workflow tracked for this capability" : undefined}
                        className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:bg-neutral-100 disabled:text-neutral-400"
                      >
                        {isAdded ? "Added ✓" : isExisting ? "Already tracked" : "Add as workflow"}
                      </button>
                    </div>

                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-700">
                        Ask about this next — {CAPABILITY_LABELS[c.capabilityTag]}
                      </summary>
                      <ol className="mt-2 space-y-1.5 list-decimal list-inside">
                        {tailoredDeepDiveQuestions(c).map((q, i) => (
                          <li key={i} className="text-xs text-neutral-600">
                            &ldquo;{q}&rdquo;
                          </li>
                        ))}
                      </ol>
                    </details>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
