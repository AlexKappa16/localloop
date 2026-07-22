import { NavLink } from 'react-router-dom';
import { ids } from '../../shared/ids';
import { en } from '../copy/en';

const personas = [
  { to: `/customer/${ids.nino}`, label: en.personaNino },
  { to: `/business/${ids.magnolia}/advertiser`, label: 'Magnolia' },
  { to: `/business/${ids.camora}/host`, label: en.personaCamora },
] as const;

export function DemoPersonaSwitcher() {
  return (
    <div className="seg" role="navigation" aria-label={en.demoMode}>
      <span className="seg__label">{en.demoMode}</span>
      <div className="seg__group">
        {personas.map((persona) => (
          <NavLink
            key={persona.to}
            to={persona.to}
            className={({ isActive }) =>
              `seg__item${isActive ? ' seg__item--active' : ''}`
            }
          >
            {persona.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
