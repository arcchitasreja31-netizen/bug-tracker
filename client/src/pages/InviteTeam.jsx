
import { useEffect, useState } from 'react';

function InviteTeam() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [email, setEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await fetch('https://bug-tracker-2fq0.onrender.com/api/projects', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok) {
          setProjects(data);
          if (data.length > 0) setProjectId(data[0]._id);
        } else {
          setMessage(data.message || 'Could not load projects');
        }
      } catch {
        setMessage('Could not connect to the server');
      }
    }

    loadProjects();
  }, []);

  async function handleInvite(e) {
    e.preventDefault();
    setMessage('');
    setInviteLink('');

    if (!projectId || !email.trim()) {
      setMessage('Please select a project and enter an email.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('https://bug-tracker-2fq0.onrender.com/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: email.trim(), projectId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invitation failed');
      }

      setInviteLink(data.inviteLink || '');
      setMessage(data.message || 'Invitation created successfully!');
      setEmail('');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setMessage('Invitation link copied!');
    } catch {
      setMessage('Unable to copy. Please copy the link manually.');
    }
  }

  return (
    <div className="invite-page">
      <h1>Invite Teammates 💌</h1>
      <p>Collaborate with your teammates and track bugs together.</p>

      <form onSubmit={handleInvite} className="invite-form">
        <label>Select Project</label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          required
        >
          <option value="">Choose a project</option>
          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name}
            </option>
          ))}
        </select>

        <label>Teammate Email</label>
        <input
          type="email"
          placeholder="teammate@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button type="submit" disabled={loading || projects.length === 0}>
          {loading ? 'Sending...' : 'Send Invitation'}
        </button>
      </form>

      {message && <p className="invite-message">{message}</p>}

      {inviteLink && (
        <div className="invite-link-box">
          <label>Share this invitation link</label>
          <input readOnly value={inviteLink} />
          <button type="button" onClick={copyLink}>Copy Link</button>
        </div>
      )}

      {projects.length === 0 && (
        <p>Create a project first before inviting teammates.</p>
      )}
    </div>
  );
}

export default InviteTeam;
