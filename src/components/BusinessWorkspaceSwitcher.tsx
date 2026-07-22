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
    <div className="switcher" aria-label={en.businessWorkspace}>
      {canAdvertiser ? (
        <NavLink
          to={`/business/${businessId}/advertiser`}
          className="btn switcher__btn"
        >
          {en.workspaceAdvertiser}
        </NavLink>
      ) : null}
      {canHost ? (
        <NavLink to={`/business/${businessId}/host`} className="btn switcher__btn">
          {en.workspaceHost}
        </NavLink>
      ) : null}
    </div>
  );
}
