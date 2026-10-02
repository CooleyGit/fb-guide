import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LearnIcon, PlaysIcon, PracticeIcon, SettingsIcon } from "./icons";
import { SettingsPanel } from "./SettingsPanel";
import { CoachingReferences } from "../learn/CoachingReferences";

const NAV = [
  { to: "/plays", label: "Plays", Icon: PlaysIcon },
  { to: "/practice", label: "Practice", Icon: PracticeIcon },
  { to: "/learn", label: "Learn", Icon: LearnIcon },
] as const;

export function AppShell() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const scrollMemory = useRef<Record<string, number>>({});
  const prevPath = useRef<string>(location.pathname);

  // Remember and restore scroll position per destination.
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    scrollMemory.current[prevPath.current] = el.scrollTop;
    const restore = scrollMemory.current[location.pathname] ?? 0;
    el.scrollTop = restore;
    prevPath.current = location.pathname;
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <nav className="nav-rail" aria-label="Main navigation">
        <div className="brand">
          <span className="brand-team">TCU 4-2-5 · STRONG SAFETY</span>
          <span className="brand-title">Own your edge.</span>
        </div>
        <ul>
          {NAV.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink to={to} className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
                <Icon />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        <button type="button" className="nav-item settings-trigger" onClick={() => setSettingsOpen(true)}>
          <SettingsIcon />
          <span>Settings</span>
        </button>
      </nav>

      <main id="main" ref={mainRef} className="app-main" tabIndex={-1}>
        <div className="app-content">
          <Outlet />
          <CoachingReferences />
        </div>
      </main>

      <nav className="bottom-nav" aria-label="Main navigation">
        {NAV.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `bottom-item${isActive ? " active" : ""}`}>
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
        <button type="button" className="bottom-item" onClick={() => setSettingsOpen(true)}>
          <SettingsIcon />
          <span>More</span>
        </button>
      </nav>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
