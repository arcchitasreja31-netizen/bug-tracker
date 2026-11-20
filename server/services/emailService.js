
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendInvitationEmail(email, inviterName, projectName, inviteLink) {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'Bug Tracker <onboarding@resend.dev>',
    to: [email],
    subject: `${inviterName} invited you to Bug Tracker`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px;">
        <h2>🐞 You're invited to Bug Tracker!</h2>
        <p>Hello,</p>
        <p><strong>${inviterName}</strong> invited you to collaborate
        on the project <strong>${projectName}</strong>.</p>
        <p>Click below to accept the invitation:</p>
        <a href="${inviteLink}"
          style="display:inline-block;padding:12px 22px;
          background:#d86b91;color:white;text-decoration:none;
          border-radius:8px;">
          Accept Invitation
        </a>
        <p>If you weren't expecting this invitation, you can ignore this email.</p>
      </div>
    `
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

module.exports = sendInvitationEmail;
