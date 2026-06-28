import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { agentName, agentEmail, action, reason } = await request.json();

    if (!agentEmail || !agentName || !action) {
      return NextResponse.json(
        { error: 'Missing required parameters: agentName, agentEmail, action' },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY is not configured in .env.local');
      return NextResponse.json(
        { error: 'Resend API key is not configured' },
        { status: 500 }
      );
    }

    const origin = request.headers.get('origin') || 'https://handtohandloans.com';
    const loginUrl = `${origin}/login`;

    let subject = '';
    let html = '';

    if (action === 'approved') {
      subject = '🎉 Congratulations! Your Agent Account is Approved';
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Approved</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background-color: #0b0f19;
              color: #f3f4f6;
              margin: 0;
              padding: 0;
              -webkit-font-smoothing: antialiased;
            }
            .wrapper {
              width: 100%;
              table-layout: fixed;
              background-color: #0b0f19;
              padding: 40px 0;
            }
            .content-box {
              max-width: 600px;
              margin: 0 auto;
              background: rgba(255, 255, 255, 0.03);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 16px;
              padding: 40px;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            }
            .logo-section {
              text-align: center;
              margin-bottom: 32px;
            }
            .logo-text {
              font-size: 24px;
              font-weight: 800;
              color: #6366f1;
              letter-spacing: -0.02em;
            }
            .header-title {
              font-size: 22px;
              font-weight: 700;
              color: #ffffff;
              text-align: center;
              margin-bottom: 24px;
            }
            .message-text {
              font-size: 16px;
              line-height: 1.6;
              color: #d1d5db;
              margin-bottom: 32px;
            }
            .btn-container {
              text-align: center;
              margin-bottom: 32px;
            }
            .btn-action {
              display: inline-block;
              background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
              color: #ffffff !important;
              text-decoration: none;
              padding: 14px 30px;
              font-size: 15px;
              font-weight: 600;
              border-radius: 8px;
              box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
            }
            .footer-text {
              font-size: 12px;
              color: #6b7280;
              text-align: center;
              border-top: 1px solid rgba(255, 255, 255, 0.08);
              padding-top: 24px;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="content-box">
              <div class="logo-section">
                <span class="logo-text">🤝 HandToHand Loans</span>
              </div>
              <h2 class="header-title">Welcome Aboard, ${agentName}!</h2>
              <div class="message-text">
                <p>Hello ${agentName},</p>
                <p>We are thrilled to inform you that your registration request as a **Financial Partner / Agent** has been officially reviewed and **approved** by our administration team!</p>
                <p>Your account is now fully active. You can log into your portal to start submitting client applications, checking eligibility status, and tracking your payout requests.</p>
              </div>
              <div class="btn-container">
                <a href="${loginUrl}" class="btn-action">Access Agent Dashboard</a>
              </div>
              <div class="message-text">
                <p>If you have any questions or require assistance setting up, please feel free to reach out to our admin team.</p>
                <p>Best regards,<br><strong>HandToHand Loans Support Team</strong></p>
              </div>
              <div class="footer-text">
                This is an automated notification. Please do not reply directly to this email.<br>
                &copy; ${new Date().getFullYear()} HandToHand Loans. All rights reserved.
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (action === 'rejected') {
      subject = '⚠️ Update on your Agent Application';
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Update</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background-color: #0b0f19;
              color: #f3f4f6;
              margin: 0;
              padding: 0;
              -webkit-font-smoothing: antialiased;
            }
            .wrapper {
              width: 100%;
              table-layout: fixed;
              background-color: #0b0f19;
              padding: 40px 0;
            }
            .content-box {
              max-width: 600px;
              margin: 0 auto;
              background: rgba(255, 255, 255, 0.03);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 16px;
              padding: 40px;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            }
            .logo-section {
              text-align: center;
              margin-bottom: 32px;
            }
            .logo-text {
              font-size: 24px;
              font-weight: 800;
              color: #6366f1;
              letter-spacing: -0.02em;
            }
            .header-title {
              font-size: 22px;
              font-weight: 700;
              color: #ffffff;
              text-align: center;
              margin-bottom: 24px;
            }
            .message-text {
              font-size: 16px;
              line-height: 1.6;
              color: #d1d5db;
              margin-bottom: 32px;
            }
            .reason-box {
              background: rgba(239, 68, 68, 0.05);
              border: 1px solid rgba(239, 68, 68, 0.2);
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 32px;
              color: #fca5a5;
              font-size: 15px;
            }
            .btn-container {
              text-align: center;
              margin-bottom: 32px;
            }
            .btn-action {
              display: inline-block;
              background: rgba(255,255,255,0.05);
              border: 1px solid rgba(255,255,255,0.15);
              color: #ffffff !important;
              text-decoration: none;
              padding: 14px 30px;
              font-size: 15px;
              font-weight: 600;
              border-radius: 8px;
            }
            .footer-text {
              font-size: 12px;
              color: #6b7280;
              text-align: center;
              border-top: 1px solid rgba(255, 255, 255, 0.08);
              padding-top: 24px;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="content-box">
              <div class="logo-section">
                <span class="logo-text">🤝 HandToHand Loans</span>
              </div>
              <h2 class="header-title">Application Status Update</h2>
              <div class="message-text">
                <p>Hello ${agentName},</p>
                <p>Thank you for submitting your application to register as a Financial Partner at HandToHand Loans. Our administration team has reviewed your details.</p>
                <p>Regrettably, we are unable to approve your application at this time due to the following reason:</p>
              </div>
              <div class="reason-box">
                <strong>Reason for rejection:</strong><br>
                ${reason || 'No specific reason provided.'}
              </div>
              <div class="message-text">
                <p>Please log in to your profile, verify that your verification documents (Avatar, Aadhaar, PAN, Voter ID, etc.) are clear and upload correct details if necessary.</p>
              </div>
              <div class="btn-container">
                <a href="${loginUrl}" class="btn-action">Update Profile Details</a>
              </div>
              <div class="message-text">
                <p>Best regards,<br><strong>HandToHand Loans Support Team</strong></p>
              </div>
              <div class="footer-text">
                This is an automated notification. Please do not reply directly to this email.<br>
                &copy; ${new Date().getFullYear()} HandToHand Loans. All rights reserved.
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    // Try sending with standard verified domain sender
    let sender = 'HandToHand Loans <noreply@handtohandloans.in>';
    console.log(`Attempting to send email to ${agentEmail} from ${sender}...`);

    let response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: sender,
        to: [agentEmail],
        subject: subject,
        html: html
      })
    });

    let data = await response.json();
    console.log('Resend first attempt result:', data);

    // Fallback: If the domain is not verified yet, send from onboarding@resend.dev
    if (!response.ok && data.message && (data.message.toLowerCase().includes('domain') || data.message.toLowerCase().includes('permission'))) {
      sender = 'onboarding@resend.dev';
      console.log(`Custom domain not verified. Falling back to sending from ${sender}...`);
      
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: sender,
          to: [agentEmail], // Resend sandbox allows sending to verified registration email
          subject: subject,
          html: html
        })
      });
      data = await response.json();
      console.log('Resend fallback attempt result:', data);
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to send email via Resend' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, emailId: data.id });
  } catch (error) {
    console.error('Error in agent-approval email route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
