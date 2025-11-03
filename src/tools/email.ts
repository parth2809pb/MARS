/**
 * Email Tool
 * Sends emails via server-side SMTP endpoint
 */

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export interface SMTPConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

export interface EmailResponse {
  messageId: string;
}

/**
 * Send an email via the server SMTP endpoint
 * @param params - Email parameters (to, subject, html)
 * @param smtpConfig - SMTP configuration
 * @returns Email response with messageId
 */
export async function sendEmail(
  params: EmailParams,
  smtpConfig: SMTPConfig
): Promise<EmailResponse> {
  if (!params.to || !params.subject || !params.html) {
    throw new Error('Email requires to, subject, and html fields');
  }

  if (!smtpConfig.host || !smtpConfig.port || !smtpConfig.user || !smtpConfig.pass || !smtpConfig.from) {
    throw new Error('SMTP configuration is incomplete');
  }

  // Validate email addresses
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(params.to)) {
    throw new Error('Invalid recipient email address');
  }
  if (!emailRegex.test(smtpConfig.from)) {
    throw new Error('Invalid from email address');
  }

  try {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
    const response = await fetch(`${serverUrl}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: params.to,
        subject: params.subject,
        html: params.html,
        smtpConfig,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Email sending failed with status ${response.status}`);
    }

    const data: EmailResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to send email');
  }
}

/**
 * Check if SMTP is configured
 * @param smtpConfig - Partial SMTP configuration
 * @returns True if all required fields are present
 */
export function isSMTPConfigured(smtpConfig: Partial<SMTPConfig>): smtpConfig is SMTPConfig {
  return !!(
    smtpConfig.host &&
    smtpConfig.port &&
    smtpConfig.user &&
    smtpConfig.pass &&
    smtpConfig.from
  );
}
