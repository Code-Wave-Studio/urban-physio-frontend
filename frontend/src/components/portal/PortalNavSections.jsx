import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import FaIcon from '../FaIcon';
import { groupPortalNav, isNavLinkActive, TONE_CLASSES } from '../../constants/portalArchitecture';
import { useAuth } from '../../contexts/AuthContext';

const ACTIVE = {
  primary: 'portal-nav-link--active-primary',
  teal: 'portal-nav-link--active-teal',
  emerald: 'portal-nav-link--active-emerald',
};

/**
 * Categorized accordion navigation for portal sidebars.
 */
export default function PortalNavSections({
  links = [],
  sectionOrder = [],
  unreadCount = 0,
  onNavigate,
  accent = 'primary',
  open = true,
}) {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const sections = useMemo(() => groupPortalNav(links, sectionOrder), [links, sectionOrder]);
  const activeCls = ACTIVE[accent] || ACTIVE.primary;

  const activeSectionId = useMemo(() => {
    for (const section of sections) {
      if (section.items.some((item) => item.to && isNavLinkActive(pathname, item))) {
        return section.id;
      }
    }
    return sections.find((s) => s.defaultOpen)?.id || sections[0]?.id;
  }, [sections, pathname]);

  const [expanded, setExpanded] = useState(() => new Set(activeSectionId ? [activeSectionId] : []));

  useEffect(() => {
    if (!activeSectionId) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      next.add(activeSectionId);
      return next;
    });
  }, [activeSectionId]);

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderItem = (link, i) => {
    if (link.action === 'logout') {
      return (
        <button
          key={`logout-${i}`}
          type="button"
          onClick={() => {
            logout();
            onNavigate?.();
          }}
          className="portal-nav-link w-full text-left text-rose-600 hover:bg-rose-50"
        >
          <span className="portal-nav-link-icon">
            <FaIcon icon={link.icon} className="text-sm" />
          </span>
          <span className="truncate flex-1">{link.label}</span>
        </button>
      );
    }

    const active = isNavLinkActive(pathname, link);
    return (
      <Link
        key={`${link.to}-${link.label}`}
        to={link.to}
        onClick={onNavigate}
        className={`portal-nav-link ${active ? activeCls : ''}`}
        style={{ transitionDelay: open ? `${Math.min(i, 12) * 16}ms` : '0ms' }}
      >
        <span className="portal-nav-link-icon">
          <FaIcon icon={link.icon} className="text-sm" />
        </span>
        <span className="truncate flex-1">{link.label}</span>
        {link.notifyKey && unreadCount > 0 && (
          <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {active && !link.notifyKey && (
          <FaIcon icon="fa-chevron-right" className="ml-auto text-xs opacity-80 shrink-0" />
        )}
      </Link>
    );
  };

  return (
    <div className="portal-nav-sections space-y-2">
      {sections.map((section) => {
        const isOpen = expanded.has(section.id);
        const tone = TONE_CLASSES[section.tone] || TONE_CLASSES.slate;
        return (
          <div key={section.id} className="portal-nav-accordion rounded-2xl overflow-hidden border border-slate-200/70 bg-white/55">
            <button
              type="button"
              onClick={() => toggle(section.id)}
              className="portal-nav-accordion-trigger w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all duration-200 ease-in-out active:scale-[0.98]"
              aria-expanded={isOpen}
            >
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${tone.chip}`}>
                <FaIcon icon={section.icon} className="text-xs" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 truncate">
                  {section.label}
                </span>
                <span className="block text-[10px] text-slate-400">{section.items.length} items</span>
              </span>
              <FaIcon
                icon="fa-chevron-down"
                className={`text-slate-400 text-xs transition-transform duration-200 ease-in-out ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <div className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden">
                <div className="px-2 pb-2 space-y-0.5">{section.items.map((link, i) => renderItem(link, i))}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
