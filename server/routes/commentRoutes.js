
const express = require('express');
const router = express.Router();

const Comment = require('../models/Comment');
const Issue = require('../models/Issue');
const protect = require('../middleware/authMiddleware');

router.use(protect);

// GET comments for your own issue
router.get('/:issueId', async (req, res) => {
  try {
    const issue = await Issue.findOne({
      _id: req.params.issueId,
      createdBy: req.user.id
    });

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const comments = await Comment.find({
      issue: issue._id
    })
      .populate('user', 'name')
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADD a comment to your own issue
router.post('/:issueId', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: 'Comment cannot be empty'
      });
    }

    const issue = await Issue.findOne({
      _id: req.params.issueId,
      createdBy: req.user.id
    });

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const comment = await Comment.create({
      issue: issue._id,
      user: req.user.id,
      text: text.trim()
    });

    const populatedComment = await comment.populate('user', 'name');

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE your own comment
router.delete('/:commentId', async (req, res) => {
  try {
    const comment = await Comment.findOneAndDelete({
      _id: req.params.commentId,
      user: req.user.id
    });

    if (!comment) {
      return res.status(404).json({
        message: 'Comment not found or you cannot delete it'
      });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
