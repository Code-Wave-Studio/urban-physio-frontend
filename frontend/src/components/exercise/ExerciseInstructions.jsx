import FaIcon from '../FaIcon';
import { normalizeInstructionSteps } from '../../utils/exerciseInstructions';

/**
 * Structured "How to Perform" block from existing steps / plain instructions.
 * Does not invent clinical content.
 */
export default function ExerciseInstructions({
  steps,
  instructions,
  exercise_instructions,
  title = 'How to Perform',
  className = '',
  compact = false,
}) {
  const items = normalizeInstructionSteps({ steps, instructions, exercise_instructions });

  if (!items.length) {
    return (
      <div className={className}>
        <h3 className={`${compact ? 'text-sm' : 'text-base'} font-bold text-slate-800 mb-2 flex items-center gap-2`}>
          <FaIcon icon="fa-list-ol" className="text-teal-600" />
          {title}
        </h3>
        <p className="text-sm text-slate-500">Instructions are not available for this exercise yet.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <h3 className={`${compact ? 'text-sm' : 'text-base md:text-lg'} font-bold text-slate-800 mb-3 flex items-center gap-2`}>
        <FaIcon icon="fa-list-ol" className="text-teal-600" />
        {title}
      </h3>
      <ol className={`space-y-2.5 ${compact ? '' : 'md:space-y-3'}`}>
        {items.map((text, i) => (
          <li key={i} className="flex gap-3 items-start">
            <span
              className="shrink-0 w-7 h-7 rounded-full bg-teal-50 text-teal-800 border border-teal-100 text-xs font-bold flex items-center justify-center mt-0.5"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <p className={`${compact ? 'text-sm' : 'text-sm md:text-base'} text-slate-700 leading-relaxed pt-0.5`}>
              {text}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
