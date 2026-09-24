import FaIcon from '../FaIcon';
import ExerciseInstructions from './ExerciseInstructions';
import ExerciseMediaDisplay from './ExerciseMediaDisplay';
import { hasExerciseMedia } from '../../utils/mediaParser';
import { normalizeInstructionSteps } from '../../utils/exerciseInstructions';

/**
 * Pre-Exercise Setup. Surfaces HEP + library fields only — never invents clinical copy.
 * KinesteX / camera must not start until the patient explicitly continues
 * (prepare is called by the parent footer action, not from this component).
 */
export default function KinesteXAiExercisePrepBrief({
  exercise,
  cameraNote = 'Required — your browser will ask for permission when the AI workout starts.',
  footerNote = 'Position yourself so your full movement is visible. Mark Complete and Skip remain available after you exit.',
}) {
  if (!exercise) return null;

  const name = exercise.exercise_name || 'Exercise';
  const therapistNotes = exercise.special_instructions || exercise.therapist_notes || '';
  const instructionSteps = normalizeInstructionSteps({
    steps: exercise.steps,
    instructions: exercise.exercise_instructions || exercise.instructions,
  });
  const showMedia = hasExerciseMedia(exercise) || !!exercise.image_url;
  const aiReady = !!exercise.ai_monitoring_effective;
  const equipment = exercise.equipment ? String(exercise.equipment).trim() : '';

  const mediaBlock = showMedia ? (
    <div className="exercise-detail-media min-w-0">
      {hasExerciseMedia(exercise) ? (
        <ExerciseMediaDisplay
          exercise={exercise}
          title={name}
          variant="player"
          layout="portrait"
        />
      ) : (
        <img
          src={exercise.image_url}
          alt={`${name} demonstration`}
          className="w-full aspect-[3/4] max-h-[min(42vh,420px)] md:max-h-[min(60vh,520px)] object-contain rounded-2xl bg-slate-900 mx-auto"
        />
      )}
    </div>
  ) : (
    <div className="rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white aspect-[3/4] max-h-[min(36vh,280px)] md:max-h-none md:min-h-[240px] flex flex-col items-center justify-center gap-2 px-4">
      <FaIcon icon="fa-dumbbell" className="text-3xl opacity-90" aria-hidden="true" />
      <p className="text-sm font-semibold text-center leading-snug">{name}</p>
      <p className="text-[11px] text-white/80 text-center">Demonstration media is not available for this exercise.</p>
    </div>
  );

  const paramChips = (
    <div className="flex flex-wrap gap-2 text-xs">
      <span className="bg-teal-50 text-teal-800 border border-teal-100 px-2.5 py-1.5 rounded-lg font-semibold">
        {exercise.sets || 1} sets
      </span>
      <span className="bg-teal-50 text-teal-800 border border-teal-100 px-2.5 py-1.5 rounded-lg font-semibold">
        {exercise.reps || 10} reps
      </span>
      {exercise.hold_seconds ? (
        <span className="bg-slate-100 px-2.5 py-1.5 rounded-lg">Hold {exercise.hold_seconds}s</span>
      ) : null}
      {exercise.rest_seconds ? (
        <span className="bg-slate-100 px-2.5 py-1.5 rounded-lg">Rest {exercise.rest_seconds}s</span>
      ) : null}
      {exercise.frequency ? (
        <span className="bg-slate-100 px-2.5 py-1.5 rounded-lg">{exercise.frequency}</span>
      ) : null}
      {equipment ? (
        <span className="bg-slate-100 px-2.5 py-1.5 rounded-lg">
          <FaIcon icon="fa-screwdriver-wrench" className="mr-1" aria-hidden="true" />
          {equipment}
        </span>
      ) : null}
    </div>
  );

  const precautionsBlock = exercise.precautions ? (
    <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5 text-sm text-amber-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700/80 mb-1 flex items-center gap-1.5">
        <FaIcon icon="fa-triangle-exclamation" aria-hidden="true" />
        Precautions
      </p>
      <p className="whitespace-pre-wrap leading-relaxed">{exercise.precautions}</p>
    </div>
  ) : null;

  const notesBlock = therapistNotes ? (
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-sm text-slate-700">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
        Therapist / doctor notes
      </p>
      <p className="whitespace-pre-wrap leading-relaxed">{therapistNotes}</p>
    </div>
  ) : null;

  const instructionsBlock =
    instructionSteps.length > 0 ? (
      <ExerciseInstructions
        steps={exercise.steps}
        instructions={exercise.exercise_instructions || exercise.instructions}
        compact
      />
    ) : null;

  const statusBlock = (
    <div
      className={`rounded-xl px-3 py-2.5 text-sm border ${
        aiReady
          ? 'bg-teal-50 border-teal-100 text-teal-900'
          : 'bg-slate-50 border-slate-100 text-slate-700'
      }`}
    >
      <p className="font-semibold flex items-center gap-1.5">
        <FaIcon icon="fa-person-walking" aria-hidden="true" />
        {aiReady ? 'Ready for AI-Guided Exercise' : 'AI monitoring not available'}
      </p>
      <p className="text-xs mt-1 leading-relaxed opacity-90">
        {aiReady
          ? 'Review the prescribed guidance below, then tap Start AI Exercise. The camera opens only after you continue — your HEP sets and reps stay unchanged.'
          : 'This exercise is not enabled for AI monitoring.'}
      </p>
    </div>
  );

  const cameraBlock = (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Camera</p>
      <p className="mt-0.5 text-slate-600 text-sm leading-relaxed">{cameraNote}</p>
    </div>
  );

  return (
    <div className="text-sm text-slate-700 min-w-0 max-w-full">
      <div className="hidden md:grid md:grid-cols-2 md:gap-6 md:items-start min-w-0">
        <div className="min-w-0 sticky top-0">{mediaBlock}</div>
        <div className="min-w-0 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Exercise</p>
            <p className="font-semibold text-slate-900 text-base mt-0.5 leading-snug">{name}</p>
          </div>
          {statusBlock}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
              Prescribed parameters
            </p>
            {paramChips}
          </div>
          {precautionsBlock}
          {notesBlock}
          {instructionsBlock}
          {cameraBlock}
          {footerNote ? (
            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">{footerNote}</p>
          ) : null}
        </div>
      </div>

      <div className="md:hidden space-y-4 min-w-0">
        {statusBlock}
        {precautionsBlock}
        <div className="min-w-0">{mediaBlock}</div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Exercise</p>
          <p className="font-semibold text-slate-900 mt-0.5 leading-snug">{name}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Prescribed parameters
          </p>
          {paramChips}
        </div>
        {notesBlock}
        {instructionsBlock}
        {cameraBlock}
        {footerNote ? (
          <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">{footerNote}</p>
        ) : null}
        <p className="text-[11px] text-slate-500 text-center px-2">
          Tap <span className="font-semibold text-teal-700">Start AI Exercise</span> below when you are ready.
          The camera will not open until then.
        </p>
      </div>
    </div>
  );
}
