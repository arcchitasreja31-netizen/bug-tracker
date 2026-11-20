
import React, { useEffect, useState } from 'react';
import Comments from './Comments';

const API_URL = 'https://bug-tracker-2fq0.onrender.com/api/issues';

function IssueList({ issues, setIssues }) {
  const [showForm, setShowForm] = useState(false);
  const [editingIssueId, setEditingIssueId] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const [newIssue, setNewIssue] = useState({
    title: '',
    project: '',
    priority: 'Medium',
    status: 'To Do',
    assignedTo: ''
  });

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');

  const token = localStorage.getItem('token');

  // Load registered users
  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch(`${API_URL}/users`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load users');
        }

        setUsers(data);
      } catch (error) {
        setError(error.message);
      }
    }

    if (token) fetchUsers();
  }, [token]);

  function handleChange(event) {
    const { name, value } = event.target;
    setNewIssue(prev => ({ ...prev, [name]: value }));
  }

  // Add or update issue
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      const isEditing = editingIssueId !== null;

      const response = await fetch(
        isEditing ? `${API_URL}/${editingIssueId}` : API_URL,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(newIssue)
        }
      );

      const savedIssue = await response.json();

      if (!response.ok) {
        throw new Error(savedIssue.message || 'Unable to save issue');
      }

      if (isEditing) {
        setIssues(prev =>
          prev.map(issue =>
            issue._id === editingIssueId ? savedIssue : issue
          )
        );
      } else {
        setIssues(prev => [...prev, savedIssue]);
      }

      resetForm();
    } catch (error) {
      setError(error.message);
    }
  }

  // Delete issue
  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this issue?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Unable to delete issue');
      }

      setIssues(prev => prev.filter(issue => issue._id !== id));
    } catch (error) {
      setError(error.message);
    }
  }

  // Edit issue
  function handleEdit(issue) {
    setEditingIssueId(issue._id);

    setNewIssue({
      title: issue.title,
      project: issue.project,
      priority: issue.priority,
      status: issue.status,
      assignedTo: issue.assignedTo?._id || ''
    });

    setShowForm(true);
    setError('');
  }

  // Reset form
  function resetForm() {
    setNewIssue({
      title: '',
      project: '',
      priority: 'Medium',
      status: 'To Do',
      assignedTo: ''
    });

    setEditingIssueId(null);
    setShowForm(false);
  }

  // Search and filter
  const filteredIssues = issues.filter(issue => {
    const searchText = search.toLowerCase();

    const assigneeName =
      issue.assignedTo?.name || issue.assignee || '';

    const searchMatch =
      (issue.title || '').toLowerCase().includes(searchText) ||
      (issue.project || '').toLowerCase().includes(searchText) ||
      assigneeName.toLowerCase().includes(searchText);

    const statusMatch =
      filterStatus === 'All' || issue.status === filterStatus;

    const priorityMatch =
      filterPriority === 'All' || issue.priority === filterPriority;

    return searchMatch && statusMatch && priorityMatch;
  });

  return (
    <div className="issue-section">
      <h2>Issue Management</h2>

      <button onClick={() => {
        resetForm();
        setShowForm(true);
      }}>
        Add New Issue
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Add and Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit}>
          <input
            name="title"
            placeholder="Issue title"
            value={newIssue.title}
            onChange={handleChange}
            required
          />

          <input
            name="project"
            placeholder="Project name"
            value={newIssue.project}
            onChange={handleChange}
            required
          />

          <select
            name="priority"
            value={newIssue.priority}
            onChange={handleChange}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>

          <select
            name="status"
            value={newIssue.status}
            onChange={handleChange}
          >
            <option>To Do</option>
            <option>In Progress</option>
            <option>Done</option>
          </select>

          <select
            name="assignedTo"
            value={newIssue.assignedTo}
            onChange={handleChange}
          >
            <option value="">Unassigned</option>

            {users.map(user => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>

          <button type="submit">
            {editingIssueId ? 'Update Issue' : 'Save Issue'}
          </button>

          <button type="button" onClick={resetForm}>
            Cancel
          </button>
        </form>
      )}

      {/* Search and Filters */}
      <div className="issue-filters">
        <input
          type="text"
          placeholder="Search by title, project or assignee..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>

        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
        >
          <option value="All">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>

      <p>Showing {filteredIssues.length} of {issues.length} issues</p>

      {/* Issue Table */}
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Project</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Assignee</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredIssues.length === 0 ? (
            <tr>
              <td colSpan="6">No matching issues found.</td>
            </tr>
          ) : (
            filteredIssues.map(issue => (
              <React.Fragment key={issue._id}>
                <tr>
                  <td>{issue.title}</td>
                  <td>{issue.project}</td>
                  <td>{issue.priority}</td>
                  <td>{issue.status}</td>
                  <td>
                    {issue.assignedTo?.name ||
                      issue.assignee ||
                      'Unassigned'}
                  </td>
                  <td>
                    <button onClick={() => handleEdit(issue)}>
                      Edit
                    </button>

                    <button onClick={() => handleDelete(issue._id)}>
                      Delete
                    </button>
                  </td>
                </tr>

                <tr>
                  <td colSpan="6">
                    <Comments issueId={issue._id} />
                  </td>
                </tr>
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default IssueList;
