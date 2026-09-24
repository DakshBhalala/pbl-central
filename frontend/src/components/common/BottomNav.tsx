import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Layers, Calendar, Users, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  return (
    <nav className="bottom-nav" aria-label="Mobile Bottom Navigation">
      <NavLink
        to="/student/dashboard"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        end
      >
        <Home size={18} />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/student/pbl"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <Layers size={18} />
        <span>PBL</span>
      </NavLink>

      <NavLink
        to="/student/calendar"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <Calendar size={18} />
        <span>Calendar</span>
      </NavLink>

      <NavLink
        to="/student/groups"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <Users size={18} />
        <span>Groups</span>
      </NavLink>

      <NavLink
        to="/student/profile"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <User size={18} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
};
