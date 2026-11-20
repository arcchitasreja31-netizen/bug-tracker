
function Sidebar({ activePage, onNavigate }) {
  const menuItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'projects', icon: '📁', label: 'My Projects' },
    { id: 'issues', icon: '🐞', label: 'All Issues' },
    { id: 'tasks', icon: '📋', label: 'My Tasks' }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span>🐞</span>
        <h2>Bug Tracker</h2>
      </div>

      <div className="sidebar-group">
        <h3>WORKSPACE</h3>
        <ul>
          {menuItems.map((item) => (
            <li
              key={item.id}
              className={activePage === item.id ? 'active' : ''}
              onClick={() => onNavigate(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-group">
        <h3>TEAM</h3>
        <ul>
          <li
            className={activePage === 'invite' ? 'active' : ''}
            onClick={() => onNavigate('invite')}
          >
            <span>👥</span>
            Invite Teammates
          </li>
        </ul>
      </div>

      <div className="sidebar-group">
        <h3>OTHER</h3>
        <ul>
          <li
            className={activePage === 'settings' ? 'active' : ''}
            onClick={() => onNavigate('settings')}
          >
            <span>⚙️</span>
            Settings
          </li>
        </ul>
      </div>

      <div className="sidebar-footer">
        <span>💗</span>
        <p>Find. Fix. Track. Repeat.</p>
      </div>
    </aside>
  );
}

export default Sidebar;
