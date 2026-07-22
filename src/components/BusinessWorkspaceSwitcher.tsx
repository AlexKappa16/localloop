import { NavLink } from 'react-router-dom';
import type { BusinessCapability } from '../../shared/types';
import { en } from '../copy/en';

type Props = {
  businessId: string;
  capabilities: BusinessCapability[];
};

export function BusinessWorkspaceSwitcher({ businessId, capabilities }: Props) {
  const canAdvertiser = capabilities.includes('advertiser');
  const canHost = capabilities.includes('host');

  if (!canAdvertiser && !canHost) return null;

  return (
    <div className="seg" role="navigation" aria-label={en.businessWorkspace}>
      <span className="seg__label">{en.businessWorkspace}</span>
      <div className="seg__group">
        {canAdvertiser ? (
          <NavLink
            to={`/business/${businessId}/advertiser`}
            className={({ isActive }) =>
              `seg__item${isActive ? ' seg__item--active' : ''}`
            }
          >
            Advertiser
          </NavLink>
        ) : null}
        {canHost ? (
          <NavLink
            to={`/business/${businessId}/host`}
            className={({ isActive }) =>
              `seg__item${isActive ? ' seg__item--active' : ''}`
            }
          >
            Host
          </NavLink>
        ) : null}
      </div>
    </div>
  );
}
