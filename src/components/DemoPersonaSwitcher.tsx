import { NavLink } from 'react-router-dom';
import { ids } from '../../shared/ids';
import { en } from '../copy/en';

const personas = [
  { to: `/customer/${ids.nino}`, label: en.personaNino },
  { to: `/business/${ids.magnolia}/advertiser`, label: en.personaMagnolia },
  { to: `/business/${ids.camora}/host`, label: en.personaCamora },
] as const;

export function DemoPersonaSwitcher() {
  return (
    <div className="switcher" aria-label={en.demoMode}>
      <span className="switcher__label">{en.demoMode}</span>
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
