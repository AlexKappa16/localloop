import { NavLink } from 'react-router-dom';
import type { BusinessCapability } from '../../shared/types';
import { ka } from '../copy/ka';

type Props = {
  businessId: string;
  capabilities: BusinessCapability[];
};

export function BusinessWorkspaceSwitcher({ businessId, capabilities }: Props) {
  const canAdvertiser = capabilities.includes('advertiser');
  const canHost = capabilities.includes('host');

  if (!canAdvertiser && !canHost) return null;

  return (
    <div className="switcher" aria-label="ბიზნესის სივრცე">
      {canAdvertiser ? (
        <NavLink
          to={`/business/${businessId}/advertiser`}
          className="btn switcher__btn"
        >
          {ka.workspaceAdvertiser}
        </NavLink>
      ) : null}
      {canHost ? (
        <NavLink to={`/business/${businessId}/host`} className="btn switcher__btn">
          {ka.workspaceHost}
        </NavLink>
      ) : null}
    </div>
  );
}
