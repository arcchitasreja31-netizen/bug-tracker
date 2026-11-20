
import { useEffect, useState } from 'react';

const API_URL = 'https://bug-tracker-2fq0.onrender.com/api/projects';

function ProjectList({ onProjectsChange }) {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  async function fetchProjects() {
    try {
      const response = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not load projects');
      }

      setProjects(data);
      onProjectsChange(data.length);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const projectData = { name, description };

    try {
      const response = await fetch(
        editingId ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(projectData)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not save project');
      }

      if (editingId) {
        setProjects(prev =>
          prev.map(project =>
            project._id === editingId ? data : project
          )
        );
      } else {
        setProjects(prev => {
          const updated = [data, ...prev];
          onProjectsChange(updated.length);
          return updated;
        });
      }

      setName('');
      setDescription('');
      setEditingId(null);
    } catch (error) {
      setError(error.message);
    }
  }

  function handleEdit(project) {
    setEditingId(project._id);
    setName(project.name);
    setDescription(project.description || '');
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not delete project');
      }

      setProjects(prev => {
        const updated = prev.filter(project => project._id !== id);
        onProjectsChange(updated.length);
        return updated;
      });
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <section className="project-section">
      <h2>My Projects</h2>

      <form className="project-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Project name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Project description"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <button type="submit">
          {editingId ? 'Update Project' : 'Add Project'}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setName('');
              setDescription('');
            }}
          >
            Cancel
          </button>
        )}
      </form>

      {error && <p className="project-error">{error}</p>}

      {loading ? (
        <p>Loading projects...</p>
      ) : projects.length === 0 ? (
        <p>No projects yet. Add your first project!</p>
      ) : (
        <div className="project-grid">
          {projects.map(project => (
            <div className="project-card" key={project._id}>
              <h3>{project.name}</h3>
              <p>{project.description || 'No description added'}</p>
              <span>{project.status}</span>

              <div className="project-actions">
                <button onClick={() => handleEdit(project)}>Edit</button>
                <button onClick={() => handleDelete(project._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default ProjectList;
