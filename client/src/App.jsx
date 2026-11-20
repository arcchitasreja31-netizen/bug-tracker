
import { useState, useEffect, useRef } from 'react';
import './App.css';

import Auth from './pages/Auth';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import StatCard from './components/StatCard';
import ProjectList from './components/ProjectList';
import IssueList from './components/IssueList';
import KanbanBoard from './components/KanbanBoard';
import InviteTeam from './pages/InviteTeam';

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  });

  const [issues, setIssues] = useState([]);
  const [projectsCount, setProjectsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const inviteProcessed = useRef(false);

useEffect(() => {
  if (!user || inviteProcessed.current) return;

  const inviteToken = new URLSearchParams(window.location.search).get('invite');

  if (!inviteToken) return;

  inviteProcessed.current = true;

  async function acceptInvitation() {
    try {
      const response = await fetch(
        `http://localhost:5000/api/team/accept/${encodeURIComponent(inviteToken)}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not accept invitation');
      }

      alert('🎉 ' + data.message);
      setActivePage('projects');
    } catch (error) {
      alert(error.message);
    } finally {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  acceptInvitation();
}, [user]);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIssues([]);
    setProjectsCount(0);
  }

  useEffect(() => {
    if (!user) {
      setIssues([]);
      setLoading(false);
      return;
    }

    async function fetchIssues() {
      setLoading(true);

      try {
        const response = await fetch(
          'http://localhost:5000/api/issues',
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || `Server error: ${response.status}`);
        }

        setIssues(data);
      } catch (error) {
        console.error('Error fetching issues:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchIssues();
  }, [user]);

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  if (loading) {
    return <h2>Loading issues...</h2>;
  }

  return (
    <div className="app">
      <Header />

      <div className="user-actions">
        <span>Welcome, {user.name}</span>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div className="dashboard-layout">
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
        />

        <main className="main-content">

          {activePage === 'dashboard' && (
            <>
              <h1>Dashboard</h1>
              <p>Welcome to your Bug Tracker workspace!</p>

              <div className="stats-container">
                <StatCard
                  title="Total Projects"
                  value={projectsCount}
                  icon="📁"
                  color="#2563eb"
                />

                <StatCard
                  title="Total Bugs"
                  value={issues.length}
                  icon="🐞"
                  color="#dc2626"
                />

                <StatCard
                  title="Open Issues"
                  value={issues.filter(issue => issue.status !== 'Done').length}
                  icon="⏳"
                  color="#d97706"
                />

                <StatCard
                  title="Completed Issues"
                  value={issues.filter(issue => issue.status === 'Done').length}
                  icon="✅"
                  color="#16a34a"
                />
              </div>
            </>
          )}

          {activePage === 'projects' && (
            <>
              <h1>My Projects</h1>
              <ProjectList onProjectsChange={setProjectsCount} />
            </>
          )}

          {activePage === 'issues' && (
            <>
              <h1>All Issues</h1>
              <IssueList
                issues={issues}
                setIssues={setIssues}
              />
            </>
          )}

          {activePage === 'tasks' && (
            <>
              <h1>My Tasks</h1>
              <KanbanBoard
                issues={issues}
                setIssues={setIssues}
              />
            </>
          )}
          {activePage === 'invite' && <InviteTeam />}

{activePage === 'settings' && (
  <>
    <h1>Settings ⚙️</h1>
    <div className="settings-card">
      <h3>Account Information</h3>
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  </>
)}

        </main>
      </div>
    </div>
  );
}

export default App;
