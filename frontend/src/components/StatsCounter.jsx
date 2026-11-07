import { useEffect, useRef, useState } from 'react';
import FaIcon from './FaIcon';

const STATS = [
  { end: 500, suffix: '+', label: 'Expert Physios', icon: 'fa-user-doctor', duration: 2000 },
  { end: 50, suffix: '+', label: 'Cities Covered', icon: 'fa-city', duration: 1800 },
  { end: 10, suffix: 'k+', label: 'Happy Patients', icon: 'fa-face-smile', duration: 2200 },
  { end: 4.8, suffix: '+', label: 'Avg. Rating', icon: 'fa-star', duration: 1600, decimals: 1 },
];

function useCountUp(target, started, duration, decimals = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!started) {
      setValue(0);
      return;
    }

    let frame;
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const current = target * eased;
      setValue(current);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else setValue(target);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started, target, duration, decimals]);

  if (decimals > 0) return value.toFixed(decimals);
  return Math.floor(value).toString();
}

function StatItem({ stat, started }) {
  const display = useCountUp(stat.end, started, stat.duration, stat.decimals ?? 0);

  return (
    <div className="text-center">
      <div className="w-9 h-9 md:w-12 md:h-12 mx-auto mb-1.5 md:mb-3 rounded-lg md:rounded-xl bg-primary-500/10 flex items-center justify-center">
        <FaIcon icon={stat.icon} className="text-base md:text-xl text-primary-600" />
      </div>
      <p className="text-xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent tabular-nums">
        {display}
        {stat.suffix}
      </p>
      <p className="text-slate-600 text-xs md:text-sm mt-0.5">{stat.label}</p>
    </div>
  );
}

export default function StatsCounter() {
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setInView(true);
          setHasAnimated(true);
        }
      },
      { threshold: 0.35, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <section ref={sectionRef} className="relative mt-6 md:mt-8 z-10 max-w-6xl mx-auto px-3 md:px-4">
      <div className="glass-strong rounded-xl md:rounded-2xl p-4 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {STATS.map((s) => (
          <StatItem key={s.label} stat={s} started={inView} />
        ))}
      </div>
    </section>
  );
}
