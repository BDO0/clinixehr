import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar,
  FlaskConical, Pill, CreditCard, Settings
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const NAV_ALL = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Home'      },
  { to: '/patients',     icon: Users,            label: 'Patients', roles: ['admin', 'doctor', 'nurse', 'staff'] },
  { to: '/appointments', icon: Calendar,         label: 'Schedule', roles: ['admin', 'doctor', 'staff'] },
  { to: '/laboratory',   icon: FlaskConical,     label: 'Lab',      roles: ['admin', 'doctor', 'nurse'] },
  { to: '/pharmacy',     icon: Pill,             label: 'Pharmacy', roles: ['admin', 'doctor', 'nurse'] },
  { to: '/billing',      icon: CreditCard,       label: 'Billing',  roles: ['admin', 'staff'] }
];

export default function BottomNav() {
  const profile = useAuthStore((s) => s.profile);
  const role    = profile?.role || 'doctor';

  const items = NAV_ALL.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  return (
    <nav className="bottom-nav">
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <Icon size={22} strokeWidth={1.8} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
