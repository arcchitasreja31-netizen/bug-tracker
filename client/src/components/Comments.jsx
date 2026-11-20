
import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:5000/api/comments';

function Comments({ issueId }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  async function fetchComments() {
    try {
      const response = await fetch(`${API_URL}/${issueId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not load comments');
      }

      setComments(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchComments();
  }, [issueId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_URL}/${issueId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not add comment');
      }

      setComments(prev => [...prev, data]);
      setText('');
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleDelete(commentId) {
    if (!window.confirm('Delete this comment?')) return;

    try {
      const response = await fetch(`${API_URL}/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not delete comment');
      }

      setComments(prev =>
        prev.filter(comment => comment._id !== commentId)
      );
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <section className="comments-section">
      <h3>Comments ({comments.length})</h3>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {loading ? (
        <p>Loading comments...</p>
      ) : (
        <div className="comments-list">
          {comments.length === 0 ? (
            <p>No comments yet. Start the discussion!</p>
          ) : (
            comments.map(comment => (
              <div className="comment-card" key={comment._id}>
                <strong>{comment.user?.name || 'User'}</strong>
                <p>{comment.text}</p>
                <small>
                  {new Date(comment.createdAt).toLocaleString()}
                </small>
                <button onClick={() => handleDelete(comment._id)}>
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Write your comment..."
          value={text}
          onChange={e => setText(e.target.value)}
          required
        />

        <button type="submit" disabled={!text.trim()}>
          Post Comment
        </button>
      </form>
    </section>
  );
}

export default Comments;
