
import { useState } from 'react';
import {
  DndContext,
  closestCorners,
  DragOverlay,
  useDraggable,
  useDroppable
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import './KanbanBoard.css';

const statuses = ['To Do', 'In Progress', 'Done'];

function IssueCard({ issue, isOverlay = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: issue._id,
    disabled: isOverlay
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.35 : 1
  };

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      className={`kanban-card ${isDragging ? 'dragging' : ''} ${
        isOverlay ? 'kanban-overlay-card' : ''
      }`}
    >
      <div className="kanban-card-top">
        <span className={`priority priority-${issue.priority?.toLowerCase()}`}>
          {issue.priority}
        </span>

        {!isOverlay && (
          <button
            type="button"
            className="kanban-drag-handle"
            {...attributes}
            {...listeners}
            aria-label={`Drag ${issue.title}`}
            title="Drag issue"
          >
            ⠿
          </button>
        )}
      </div>

      <h4>{issue.title}</h4>
      <p>Project: {issue.project}</p>
      <p>Assigned to: {issue.assignee || 'Unassigned'}</p>
    </div>
  );
}

function KanbanColumn({ status, issues, onStatusChange }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status
  });

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'kanban-column-over' : ''}`}
    >
      <div className="kanban-column-heading">
        <h3>{status}</h3>
        <span className="kanban-count">{issues.length}</span>
      </div>

      <div className="kanban-cards">
        {issues.length === 0 && (
          <p className="kanban-empty">
            Drop an issue here
          </p>
        )}

        {issues.map((issue) => (
          <div key={issue._id}>
            <IssueCard issue={issue} />

            <select
              className="kanban-status-select"
              value={issue.status}
              onChange={(e) =>
                onStatusChange(issue._id, e.target.value)
              }
            >
              {statuses.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

function KanbanBoard({ issues, setIssues }) {
  const [activeIssue, setActiveIssue] = useState(null);

  async function updateIssueStatus(issueId, newStatus) {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Please log in again.');
      }

      const response = await fetch(
        `http://localhost:5000/api/issues/${issueId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      const updatedIssue = await response.json();

      if (!response.ok) {
        throw new Error(
          updatedIssue.message || 'Failed to update issue status'
        );
      }

      setIssues((previousIssues) =>
        previousIssues.map((issue) =>
          issue._id === issueId ? updatedIssue : issue
        )
      );
    } catch (error) {
      console.error('Status update error:', error);
      alert(error.message || 'Unable to update issue status.');
    }
  }

  function handleDragStart(event) {
    const issue = issues.find(
      (item) => item._id === event.active.id
    );

    setActiveIssue(issue || null);
  }

  async function handleDragEnd(event) {
    const { active, over } = event;

    setActiveIssue(null);

    if (!over) return;

    const issue = issues.find(
      (item) => item._id === active.id
    );

    if (!issue) return;

    let newStatus;

    if (statuses.includes(over.id)) {
      newStatus = over.id;
    } else {
      const targetIssue = issues.find(
        (item) => item._id === over.id
      );

      newStatus = targetIssue?.status;
    }

    if (!newStatus || newStatus === issue.status) return;

    await updateIssueStatus(issue._id, newStatus);
  }

  return (
    <section className="kanban-section">
      <div className="kanban-title">
        <div>
          <h2>Kanban Board</h2>
          <p>Drag and drop issues to update their progress.</p>
        </div>
      </div>

      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveIssue(null)}
      >
        <div className="kanban-container">
          {statuses.map((status) => {
            const filteredIssues = issues.filter(
              (issue) => issue.status === status
            );

            return (
              <KanbanColumn
                key={status}
                status={status}
                issues={filteredIssues}
                onStatusChange={updateIssueStatus}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeIssue ? (
            <IssueCard issue={activeIssue} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}

export default KanbanBoard;
