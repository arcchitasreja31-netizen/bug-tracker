
const express = require('express');
const router = express.Router();

const Issue = require('../models/Issue');
const User = require('../models/User');
const Project = require('../models/Project');
const protect = require('../middleware/authMiddleware');

router.use(protect);

// Get projects accessible to the logged-in user
async function getAccessibleProjects(userId) {
  return Project.find({
    $or: [
      { createdBy: userId },
      { members: userId }
    ]
  });
}

// GET registered users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('name email')
      .sort({ name: 1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all issues from accessible projects
router.get('/', async (req, res) => {
  try {
    const projects = await getAccessibleProjects(req.user.id);
    const projectNames = projects.map(project => project.name);

    const issues = await Issue.find({
      $or: [
        { createdBy: req.user.id },
        { project: { $in: projectNames } }
      ]
    })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE an issue
router.post('/', async (req, res) => {
  try {
    const { title, project, priority, status, assignedTo } = req.body;

    const projects = await getAccessibleProjects(req.user.id);
    const selectedProject = projects.find(p => p.name === project);

    if (!selectedProject) {
      return res.status(403).json({
        message: 'You do not have access to this project'
      });
    }

    let assigneeName = '';

    if (assignedTo) {
      const user = await User.findById(assignedTo).select('name');

      if (!user) {
        return res.status(400).json({
          message: 'Assigned user not found'
        });
      }

      assigneeName = user.name;
    }

    const issue = await Issue.create({
      title,
      project,
      priority,
      status,
      assignee: assigneeName,
      assignedTo: assignedTo || null,
      createdBy: req.user.id
    });

    const populatedIssue = await Issue.findById(issue._id)
      .populate('assignedTo', 'name email');

    res.status(201).json(populatedIssue);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE an accessible project issue
router.put('/:id', async (req, res) => {
  try {
    const projects = await getAccessibleProjects(req.user.id);
    const projectNames = projects.map(p => p.name);

    const { title, project, priority, status, assignedTo } = req.body;
    const updates = {};

    if (title !== undefined) updates.title = title;
    if (priority !== undefined) updates.priority = priority;
    if (status !== undefined) updates.status = status;

    if (project !== undefined) {
      if (!projectNames.includes(project)) {
        return res.status(403).json({
          message: 'You do not have access to this project'
        });
      }
      updates.project = project;
    }

    if (assignedTo !== undefined) {
      if (assignedTo) {
        const user = await User.findById(assignedTo).select('name');

        if (!user) {
          return res.status(400).json({
            message: 'Assigned user not found'
          });
        }

        updates.assignedTo = user._id;
        updates.assignee = user.name;
      } else {
        updates.assignedTo = null;
        updates.assignee = '';
      }
    }

    const issue = await Issue.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [
          { createdBy: req.user.id },
          { project: { $in: projectNames } }
        ]
      },
      updates,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.json(issue);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE an accessible project issue
router.delete('/:id', async (req, res) => {
  try {
    const projects = await getAccessibleProjects(req.user.id);
    const projectNames = projects.map(p => p.name);

    const issue = await Issue.findOneAndDelete({
      _id: req.params.id,
      $or: [
        { createdBy: req.user.id },
        { project: { $in: projectNames } }
      ]
    });

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
