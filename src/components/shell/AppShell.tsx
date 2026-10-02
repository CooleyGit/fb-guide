import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LearnIcon, PlaysIcon, PracticeIcon, SettingsIcon } from "./icons";
import { ChevronIcon } from "../plays/icons";
import { SettingsPanel } from "./SettingsPanel";
import { CoachingReferences } from "../learn/CoachingReferences";

const NAV = [
  { to: "/plays", label: "Plays", Icon: PlaysIcon },
  { to: "/practice", label: "Practice", Icon: PracticeIcon },
  { to: "/learn", label: "Learn", Icon: LearnIcon },
] as const;

// Only Strong Safety is built today; the rest are stubbed for a future feature.
const POSITIONS = [
  { id: "SS", label: "SS - Strong Safety" },
  { id: "FS", label: "FS - Free Safety" },
  { id: "WS", label: "WS - Weak Safety" },
  { id: "CB", label: "CB - Cornerback" },
  { id: "M", label: "M - Mike LB" },
  { id: "W", label: "W - Will LB" },
  { id: "E", label: "E - Defensive End" },
  { id: "N", label: "N - Nose / Tackle" },
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
          <span className="brand-unit">Defense</span>
          <span className="brand-team">TCU 4-2-5</span>
          <PositionMenu />
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

/** Position selector (custom menu). Only Strong Safety is built today. */
function PositionMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="position-menu" ref={ref}>
      <button
        type="button"
        className="position-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        SS - Strong Safety
        <ChevronIcon open={open} />
      </button>
      {open && (
        <ul className="position-dropdown" role="menu" aria-label="Defensive position">
          {POSITIONS.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={p.id === "SS"}
                className={`position-item${p.id === "SS" ? " selected" : ""}`}
                disabled={p.id !== "SS"}
                onClick={() => setOpen(false)}
              >
                {p.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
