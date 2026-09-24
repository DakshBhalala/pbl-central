import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  CheckSquare,
  Users,
  Layers,
  Calendar,
  Clock,
  User,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentApi } from '../../api/student';
import { facultyApi } from '../../api/faculty';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  icon: React.ComponentType<{ size?: number | string }>;
  path: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [items, setItems] = useState<CommandItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load searchable items according to user role
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }

    const loadData = async () => {
      const baseItems: CommandItem[] = [];

      if (user?.role === 'STUDENT') {
        baseItems.push(
          { id: 'nav-dash', title: 'Dashboard', subtitle: 'Overview of progress and deadlines', category: 'Navigation', icon: Layers, path: '/student/dashboard' },
          { id: 'nav-pbl', title: 'My PBL Activities', subtitle: 'View all enrolled PBL subjects', category: 'Navigation', icon: BookOpen, path: '/student/pbl' },
          { id: 'nav-cal', title: 'Academic Calendar', subtitle: 'Deadlines by month and week', category: 'Navigation', icon: Calendar, path: '/student/calendar' },
          { id: 'nav-time', title: 'Gantt Timeline', subtitle: 'Component milestones timeline', category: 'Navigation', icon: Clock, path: '/student/timeline' },
          { id: 'nav-grp', title: 'My Project Groups', subtitle: 'Team memberships and join codes', category: 'Navigation', icon: Users, path: '/student/groups' },
          { id: 'nav-prof', title: 'Student Profile', subtitle: 'Contact info and academic details', category: 'Navigation', icon: User, path: '/student/profile' }
        );

        try {
          const pbls = await studentApi.getPblActivities();
          pbls.forEach(p => {
            baseItems.push({
              id: `pbl-${p.id}`,
              title: p.title,
              subtitle: `${p.subject_name || 'Subject'} · ${p.subject_code || ''}`,
              category: 'PBL Activities',
              icon: BookOpen,
              path: `/student/pbl/${p.id}`
            });
          });

          const dash = await studentApi.getDashboard();
          dash.upcoming_deadlines.forEach(c => {
            baseItems.push({
              id: `comp-${c.id}`,
              title: c.title,
              subtitle: `Due: ${new Date(c.deadline).toLocaleDateString()}`,
              category: 'Upcoming Components',
              icon: CheckSquare,
              path: `/student/pbl/${c.pbl_activity_id}`
            });
          });
        } catch {
          // Keep base items
        }
      } else if (user?.role === 'FACULTY') {
        baseItems.push(
          { id: 'fac-dash', title: 'Faculty Workspace', subtitle: 'Active overview and pending reviews', category: 'Navigation', icon: Layers, path: '/faculty/dashboard' },
          { id: 'fac-pbl', title: 'PBL Management', subtitle: 'Create, duplicate, and configure PBLs', category: 'Navigation', icon: BookOpen, path: '/faculty/pbl' },
          { id: 'fac-comp', title: 'Component Bank', subtitle: 'All component assignments across subjects', category: 'Navigation', icon: CheckSquare, path: '/faculty/components' },
          { id: 'fac-rev', title: 'Submission Reviews', subtitle: 'Evaluate student submissions and marks', category: 'Navigation', icon: Sparkles, path: '/faculty/reviews' },
          { id: 'fac-top', title: 'Topic Pool & Approvals', subtitle: 'Manage student proposed topics', category: 'Navigation', icon: Layers, path: '/faculty/topics' },
          { id: 'fac-grp', title: 'Group Oversight', subtitle: 'Student project group allocations', category: 'Navigation', icon: Users, path: '/faculty/groups' },
          { id: 'fac-stu', title: 'Student Roster & CSV', subtitle: 'Import CSV and manage student cohort', category: 'Navigation', icon: Users, path: '/faculty/students' },
          { id: 'fac-ana', title: 'Performance Analytics', subtitle: 'Subject completion and submission stats', category: 'Navigation', icon: Layers, path: '/faculty/analytics' }
        );

        try {
          const pbls = await facultyApi.getPblActivities();
          pbls.forEach(p => {
            baseItems.push({
              id: `fac-pbl-${p.id}`,
              title: p.title,
              subtitle: `${p.subject_name || 'Subject'} · Sem ${p.semester_name || ''}`,
              category: 'PBL Activities',
              icon: BookOpen,
              path: `/faculty/pbl/${p.id}`
            });
          });
        } catch {
          // Keep base items
        }
      } else if (user?.role === 'ADMIN') {
        baseItems.push(
          { id: 'adm-dash', title: 'Admin Console', subtitle: 'Institutional overview and statistics', category: 'Navigation', icon: Layers, path: '/admin/dashboard' },
          { id: 'adm-dept', title: 'Departments', subtitle: 'Engineering departments directory', category: 'Institution', icon: Layers, path: '/admin/departments' },
          { id: 'adm-acad', title: 'Programs & Semesters', subtitle: 'Academic years, programs and divisions', category: 'Institution', icon: Calendar, path: '/admin/academic' },
          { id: 'adm-sub', title: 'Subjects Directory', subtitle: 'Subject codes and semester curriculum', category: 'Institution', icon: BookOpen, path: '/admin/subjects' },
          { id: 'adm-usr', title: 'User Management', subtitle: 'Student enrollment and faculty accounts', category: 'Users', icon: Users, path: '/admin/users' },
          { id: 'adm-pbl', title: 'PBL Oversight', subtitle: 'Institution-wide PBL activities and status', category: 'PBL', icon: BookOpen, path: '/admin/pbl' },
          { id: 'adm-types', title: 'Component Types', subtitle: 'PPT, Report, Poster, Lab settings', category: 'PBL', icon: CheckSquare, path: '/admin/component-types' },
          { id: 'adm-hist', title: 'Academic History', subtitle: 'Archived semester cohorts and records', category: 'History', icon: Clock, path: '/admin/history' },
          { id: 'adm-sett', title: 'System Settings', subtitle: 'Instance parameters and defaults', category: 'System', icon: Layers, path: '/admin/settings' }
        );
      }

      setItems(baseItems);
    };

    loadData();
  }, [isOpen, user]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filter items based on query
  const filtered = items.filter(item => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    );
  });

  // Group filtered results
  const grouped: Record<string, CommandItem[]> = {};
  filtered.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  // Flat list for arrow keys
  const flatFiltered = filtered;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1 < flatFiltered.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 >= 0 ? prev - 1 : flatFiltered.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatFiltered[selectedIndex]) {
        navigate(flatFiltered[selectedIndex].path);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  let currentIndexTracker = 0;

  return (
    <div className="command-palette-backdrop" onClick={onClose}>
      <div
        className="command-palette-box"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="command-palette-input-wrap">
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            ref={inputRef}
            className="command-palette-input"
            placeholder="Type a command or search PBL activities, components, subjects..."
            value={query}
            onKeyDown={handleKeyDown}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <span className="badge badge-muted" style={{ fontSize: '0.6875rem' }}>
            ESC
          </span>
        </div>

        <div className="command-palette-results">
          {flatFiltered.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No results found for "{query}"
            </div>
          ) : (
            Object.entries(grouped).map(([category, catItems]) => (
              <div key={category} style={{ marginBottom: '8px' }}>
                <div className="command-palette-group-title">{category}</div>
                {catItems.map(item => {
                  const itemIndex = currentIndexTracker++;
                  const isSelected = itemIndex === selectedIndex;
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.id}
                      className={`command-palette-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        navigate(item.path);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--surface-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <Icon size={14} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{item.title}</div>
                          {item.subtitle && (
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                      </div>
                      <ArrowRight size={14} style={{ color: 'var(--text-muted)', opacity: isSelected ? 1 : 0 }} />
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="command-palette-footer">
          <span>Navigate with <kbd>↑</kbd> <kbd>↓</kbd> · Select with <kbd>↵</kbd></span>
          <span>PBL Central Workspace</span>
        </div>
      </div>
    </div>
  );
};
