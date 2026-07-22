import { NavLink } from 'react-router-dom';
import { ids } from '../../shared/ids';
import { ka } from '../copy/ka';

const personas = [
  { to: `/customer/${ids.nino}`, label: ka.personaNino },
  { to: `/business/${ids.magnolia}/advertiser`, label: ka.personaMagnolia },
  { to: `/business/${ids.camora}/host`, label: ka.personaCamora },
] as const;

export function DemoPersonaSwitcher() {
  return (
    <div className="switcher" aria-label={ka.demoMode}>
      <span className="switcher__label">{ka.demoMode}</span>
      {personas.map((persona) => (
        <NavLink
          key={persona.to}
          to={persona.to}
          className="btn switcher__btn"
          style={{ minHeight: 'var(--touch-min)' }}
        >
          {persona.label}
        </NavLink>
      ))}
    </div>
  );
}
