const fs = require('fs');

const routeFile = 'S:/calculator/loan-checker/src/app/api/agent-approval/route.js';

const codeContent = `import { NextResponse } from 'next/server';

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
    const loginUrl = \`\${origin}/login\`;

    let subject = '';
    let html = '';

    if (action === 'approved') {
      subject = 'Congratulations! Your Agent Account is Approved';
      html = \`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Approved</title>
  <style>
    #outlook a { padding:0; }
    .ReadMsgBody { width:100%; } .ExternalClass { width:100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
    body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { -ms-interpolation-mode:bicubic; }
    body { height:100% !important; margin:0 !important; padding:0 !important; width:100% !important; background-color: #0a0f1e; }
    table { border-collapse:collapse !important; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .card-body { padding: 32px 20px !important; }
      .header-pad { padding: 28px 20px 20px !important; }
      .footer-pad { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;width:100% !important;background-color:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed;background-color:#0a0f1e;">
    <tr>
      <td align="center" style="padding:40px 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width:560px;background:#0d1627;border:1px solid #1a2744;border-radius:20px;overflow:hidden;">
          <!-- Gradient Top Bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#10b981,#34d399,#6ee7b7);font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <!-- Header -->
          <tr>
            <td class="header-pad" align="center" style="padding:36px 40px 28px;border-bottom:1px solid rgba(255,255,255,0.05);">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" valign="middle" style="padding-right:10px;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="width:38px;height:38px;background:#10b981;border-radius:10px;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#022c1e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:9px;">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          </svg>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="left" valign="middle">
                    <span style="font-size:20px;font-weight:700;color:#f1f5f9;letter-spacing:-0.3px;">HandToHand <span style="color:#10b981;">Loans</span></span>
                  </td>
                </tr>
              </table>
              <p style="margin:6px 0 0;font-size:11px;color:#64748b;letter-spacing:1.5px;text-transform:uppercase;">Fintech &mdash; Trusted Lending Platform</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td class="card-body" style="padding:44px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <!-- Icon Badge (Success Checkmark) -->
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <table border="0" cellpadding="0" cellspacing="0" style="border:1.5px solid rgba(16,185,129,0.3);border-radius:50%;background:rgba(16,185,129,0.07);">
                      <tr>
                        <td style="padding:18px;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
                            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Title -->
                <tr>
                  <td align="center" style="padding-bottom:14px;">
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#f8fafc;letter-spacing:-0.3px;line-height:30px;">
                      Welcome Aboard, \${agentName}!
                    </h1>
                  </td>
                </tr>
                <!-- Subtitle / Main Text -->
                <tr>
                  <td align="center" style="padding-bottom:36px;">
                    <p style="margin:0;font-size:14px;line-height:1.7;color:#94a3b8;">
                      We are thrilled to inform you that your registration request as a <strong>Financial Partner / Agent</strong> has been reviewed and approved by our administration team. Your account is now fully active!
                    </p>
                  </td>
                </tr>
                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding-bottom:36px;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="border-radius:10px;background:#10b981;">
                          <a href="\${loginUrl}" target="_blank" style="font-size:14px;font-weight:700;color:#022c1e;text-decoration:none;border-radius:10px;padding:14px 38px;display:inline-block;letter-spacing:0.4px;">
                            Access Agent Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Link Box -->
                <tr>
                  <td style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:14px 16px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:600;text-transform:uppercase;color:#475569;letter-spacing:0.8px;">Direct Portal Access Link:</p>
                    <p style="margin:0;font-size:12px;color:#3b82f6;word-break:break-all;">
                      <a href="\${loginUrl}" style="color:#3b82f6;text-decoration:none;">\${loginUrl}</a>
                    </p>
                  </td>
                </tr>
                <!-- Divider & Help Note -->
                <tr>
                  <td style="padding:36px 0 0;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid rgba(255,255,255,0.05);">
                      <tr><td style="padding-top:28px;">
                        <p style="margin:0;font-size:12px;line-height:1.7;color:#475569;text-align:center;">
                          You can now start submitting client applications, checking eligibility status, and tracking payout requests directly from your dashboard.
                        </p>
                      </td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td class="footer-pad" align="center" style="background:rgba(0,0,0,0.2);padding:24px 40px;border-top:1px solid rgba(255,255,255,0.04);">
              <p style="margin:0;font-size:11px;line-height:1.9;color:#475569;">
                &copy; \${new Date().getFullYear()} HandToHand Loans &mdash; Fintech. All rights reserved.<br>
                Need help? Call us at <a href="tel:+918171261318" style="color:#10b981;text-decoration:none;font-weight:600;">+91 8171261318</a>
              </p>
              <table border="0" cellpadding="0" cellspacing="0" style="margin:14px auto 0;">
                <tr>
                  <td style="font-size:10px;color:#334155;letter-spacing:0.5px;padding:0 12px;">
                    <span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:#10b981;vertical-align:middle;margin-right:5px;"></span>256-bit SSL Secured
                  </td>
                  <td style="font-size:10px;color:#334155;letter-spacing:0.5px;padding:0 12px;">
                    <span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:#10b981;vertical-align:middle;margin-right:5px;"></span>RBI Compliant
                  </td>
                  <td style="font-size:10px;color:#334155;letter-spacing:0.5px;padding:0 12px;">
                    <span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:#10b981;vertical-align:middle;margin-right:5px;"></span>ISO 27001
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
\`;
    } else if (action === 'rejected') {
      subject = 'Update on your Agent Application';
      html = \`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Status Update</title>
  <style>
    #outlook a { padding:0; }
    .ReadMsgBody { width:100%; } .ExternalClass { width:100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
    body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { -ms-interpolation-mode:bicubic; }
    body { height:100% !important; margin:0 !important; padding:0 !important; width:100% !important; background-color: #0a0f1e; }
    table { border-collapse:collapse !important; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .card-body { padding: 32px 20px !important; }
      .header-pad { padding: 28px 20px 20px !important; }
      .footer-pad { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;width:100% !important;background-color:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed;background-color:#0a0f1e;">
    <tr>
      <td align="center" style="padding:40px 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width:560px;background:#0d1627;border:1px solid #1a2744;border-radius:20px;overflow:hidden;">
          <!-- Gradient Top Bar (Orange/Alert) -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#f59e0b,#fca5a5,#ef4444);font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <!-- Header -->
          <tr>
            <td class="header-pad" align="center" style="padding:36px 40px 28px;border-bottom:1px solid rgba(255,255,255,0.05);">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" valign="middle" style="padding-right:10px;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="width:38px;height:38px;background:#ef4444;border-radius:10px;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2c0202" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:9px;">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                          </svg>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="left" valign="middle">
                    <span style="font-size:20px;font-weight:700;color:#f1f5f9;letter-spacing:-0.3px;">HandToHand <span style="color:#ef4444;">Loans</span></span>
                  </td>
                </tr>
              </table>
              <p style="margin:6px 0 0;font-size:11px;color:#64748b;letter-spacing:1.5px;text-transform:uppercase;">Fintech &mdash; Trusted Lending Platform</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td class="card-body" style="padding:44px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <!-- Icon Badge (Alert Triangle) -->
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <table border="0" cellpadding="0" cellspacing="0" style="border:1.5px solid rgba(239,68,68,0.3);border-radius:50%;background:rgba(239,68,68,0.07);">
                      <tr>
                        <td style="padding:18px;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Title -->
                <tr>
                  <td align="center" style="padding-bottom:14px;">
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#f8fafc;letter-spacing:-0.3px;line-height:30px;">
                      Application Status Update
                    </h1>
                  </td>
                </tr>
                <!-- Subtitle / Main Text -->
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <p style="margin:0;font-size:14px;line-height:1.7;color:#94a3b8;">
                      Thank you for submitting your application to register as a Financial Partner at HandToHand Loans. Regrettably, we are unable to approve your application at this time due to the following reason:
                    </p>
                  </td>
                </tr>
                <!-- Rejection Reason Box -->
                <tr>
                  <td style="background:rgba(239,68,68,0.04);border:1px solid rgba(239,68,68,0.15);border-radius:10px;padding:18px;margin-bottom:32px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:600;text-transform:uppercase;color:#f87171;letter-spacing:0.8px;">Reason for Rejection:</p>
                    <p style="margin:0;font-size:13px;line-height:1.6;color:#fca5a5;">
                      \${reason || 'No specific reason provided.'}
                    </p>
                  </td>
                </tr>
                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding-top:28px;padding-bottom:36px;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);">
                          <a href="\${loginUrl}" target="_blank" style="font-size:14px;font-weight:700;color:#f1f5f9;text-decoration:none;border-radius:10px;padding:14px 38px;display:inline-block;letter-spacing:0.4px;">
                            Update Profile Details
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Divider & Support Note -->
                <tr>
                  <td style="padding:36px 0 0;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid rgba(255,255,255,0.05);">
                      <tr><td style="padding-top:28px;">
                        <p style="margin:0;font-size:12px;line-height:1.7;color:#475569;text-align:center;">
                          Please log in, verify that your verification documents (Avatar, Aadhaar, PAN, Voter ID) are clear, and re-upload the correct details.
                        </p>
                      </td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td class="footer-pad" align="center" style="background:rgba(0,0,0,0.2);padding:24px 40px;border-top:1px solid rgba(255,255,255,0.04);">
              <p style="margin:0;font-size:11px;line-height:1.9;color:#475569;">
                &copy; \${new Date().getFullYear()} HandToHand Loans &mdash; Fintech. All rights reserved.<br>
                Need help? Call us at <a href="tel:+918171261318" style="color:#ef4444;text-decoration:none;font-weight:600;">+91 8171261318</a>
              </p>
              <table border="0" cellpadding="0" cellspacing="0" style="margin:14px auto 0;">
                <tr>
                  <td style="font-size:10px;color:#334155;letter-spacing:0.5px;padding:0 12px;">
                    <span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:#ef4444;vertical-align:middle;margin-right:5px;"></span>256-bit SSL Secured
                  </td>
                  <td style="font-size:10px;color:#334155;letter-spacing:0.5px;padding:0 12px;">
                    <span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:#ef4444;vertical-align:middle;margin-right:5px;"></span>RBI Compliant
                  </td>
                  <td style="font-size:10px;color:#334155;letter-spacing:0.5px;padding:0 12px;">
                    <span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:#ef4444;vertical-align:middle;margin-right:5px;"></span>ISO 27001
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
\`;
    }

    // Try sending with standard verified domain sender
    let sender = 'HandToHand Loans <noreply@handtohandloans.com>';
    if (process.env.NEXT_PUBLIC_SITE_DOMAIN) {
      sender = \`HandToHand Loans <noreply@\${process.env.NEXT_PUBLIC_SITE_DOMAIN}>\`;
    } else {
      sender = 'HandToHand Loans <noreply@handtohandloans.in>';
    }
    console.log(\`Attempting to send email to \${agentEmail} from \${sender}...\`);

    let response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${resendApiKey}\`
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
      console.log(\`Custom domain not verified. Falling back to sending from \${sender}...\`);
      
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${resendApiKey}\`
        },
        body: JSON.stringify({
          from: sender,
          to: [agentEmail],
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
`;

fs.writeFileSync(routeFile, codeContent, 'utf8');
console.log('Successfully updated agent-approval route.js to match the new email template theme!');
