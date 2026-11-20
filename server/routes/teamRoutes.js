
const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const Project = require('../models/Project');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const protect = require('../middleware/authMiddleware');
const sendInvitationEmail = require('../services/emailService');

router.use(protect);

// Invite a teammate by email and generate a shareable link
router.post('/invite', async (req, res) => {
  try {
    const { email, projectId } = req.body;

    if (!email || !projectId) {
      return res.status(400).json({
        message: 'Email and project are required'
      });
    }

    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { createdBy: req.user.id },
        { members: req.user.id }
      ]
    });

    if (!project) {
      return res.status(404).json({
        message: 'Project not found or access denied'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (await User.findOne({ email: normalizedEmail })) {
      const existingUser = await User.findOne({
        email: normalizedEmail
      });

      if (project.members.some(
        member => member.toString() === existingUser._id.toString()
      ) || project.createdBy.toString() === existingUser._id.toString()) {
        return res.status(409).json({
          message: 'This user is already a project member'
        });
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    await Invitation.create({
      email: normalizedEmail,
      project: project._id,
      invitedBy: req.user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    const inviteLink =
      `${process.env.FRONTEND_URL}/?invite=${token}`;

    let emailSent = false;

try {
  await sendInvitationEmail(
    normalizedEmail,
    'Your teammate',
    project.name,
    inviteLink
  );
  emailSent = true;
} catch (error) {
  console.log('Email not sent:', error.message);
}

    res.status(201).json({
  message: emailSent
    ? 'Invitation email sent successfully!'
    : 'Invitation link generated! Copy and share it with your teammate.',
  inviteLink,
  emailSent
});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Accept invitation after logging in
router.post('/accept/:token', async (req, res) => {
  try {
    const tokenHash = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const invitation = await Invitation.findOne({
      tokenHash,
      acceptedAt: null,
      expiresAt: { $gt: new Date() }
    });

    if (!invitation) {
      return res.status(400).json({
        message: 'Invitation is invalid or expired'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user || user.email !== invitation.email) {
      return res.status(403).json({
        message: 'Log in with the invited email address'
      });
    }

    await Project.findByIdAndUpdate(invitation.project, {
      $addToSet: { members: user._id }
    });

    invitation.acceptedAt = new Date();
    await invitation.save();

    res.json({ message: 'You joined the project successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
