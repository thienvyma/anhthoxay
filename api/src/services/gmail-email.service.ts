/**
 * Gmail Email Service
 * Handles sending quotation emails via Gmail API using Google OAuth2
 *
 * **Feature: furniture-quotation-email**
 * **Validates: Requirements 6.1, 6.3, 6.4**
 */

import { google } from 'googleapis';
import { prisma } from '../utils/prisma';
import { decrypt, isEncrypted } from '../utils/encryption';

// Google OAuth2 configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4202/integrations/google/callback';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 8000,  // 8 seconds
};

export interface SendEmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  pdfBuffer: Buffer;
  pdfFilename: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class GmailEmailService {
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );
  }


  /**
   * Get decrypted refresh token from stored credentials
   * Handles migration from plaintext to encrypted tokens
   *
   * @param credentials - The stored credentials (may be encrypted or plaintext)
   * @returns The decrypted refresh token
   */
  private getDecryptedToken(credentials: string): string {
    if (isEncrypted(credentials)) {
      return decrypt(credentials);
    }
    // Return as-is for plaintext tokens (legacy support)
    console.warn('Found plaintext token in database. Consider running migration to encrypt existing tokens.');
    return credentials;
  }

  /**
   * Check if Gmail integration is configured and ready to send emails
   * _Requirements: 6.2_
   *
   * @returns true if Google integration is configured with valid credentials
   */
  async isConfigured(): Promise<boolean> {
    try {
      const integration = await prisma.integration.findUnique({
        where: { type: 'google_sheets' },
      });

      if (!integration?.credentials) {
        return false;
      }

      // Verify we have valid credentials by checking if we can get an access token
      const refreshToken = this.getDecryptedToken(integration.credentials);
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });

      // Try to get access token to verify credentials are valid
      const { token } = await this.oauth2Client.getAccessToken();
      return !!token;
    } catch (error) {
      console.error('Gmail isConfigured check failed:', error);
      return false;
    }
  }

  /**
   * Refresh OAuth2 token if expired
   * _Requirements: 6.4_
   */
  async refreshTokenIfNeeded(): Promise<void> {
    try {
      const integration = await prisma.integration.findUnique({
        where: { type: 'google_sheets' },
      });

      if (!integration?.credentials) {
        throw new Error('Google integration not configured');
      }

      const refreshToken = this.getDecryptedToken(integration.credentials);
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });

      // Force token refresh
      await this.oauth2Client.getAccessToken();
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Failed to refresh OAuth2 token');
    }
  }


  /**
   * Create a MIME message with PDF attachment
   *
   * @param params - Email parameters including recipient, subject, content, and PDF
   * @returns Base64 encoded MIME message
   */
  private createMimeMessage(params: SendEmailParams): string {
    const { to, subject, htmlContent, pdfBuffer, pdfFilename } = params;

    // Generate a unique boundary for multipart message
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    // Build MIME message
    const messageParts = [
      `From: me`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset="UTF-8"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      Buffer.from(htmlContent).toString('base64'),
      ``,
      `--${boundary}`,
      `Content-Type: application/pdf; name="${pdfFilename}"`,
      `Content-Disposition: attachment; filename="${pdfFilename}"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      pdfBuffer.toString('base64'),
      ``,
      `--${boundary}--`,
    ];

    const message = messageParts.join('\r\n');

    // Encode for Gmail API (URL-safe base64)
    return Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Send quotation email with PDF attachment using Gmail API
   * _Requirements: 6.1, 6.3_
   *
   * @param params - Email parameters
   * @returns Result with success status and optional message ID or error
   */
  async sendQuotationEmail(params: SendEmailParams): Promise<SendEmailResult> {
    // Check if configured first
    const configured = await this.isConfigured();
    if (!configured) {
      return {
        success: false,
        error: 'Gmail integration not configured. Please set up Google integration in Admin Settings.',
      };
    }

    // Retry with exponential backoff
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < RETRY_CONFIG.maxRetries; attempt++) {
      try {
        // Refresh token if needed
        await this.refreshTokenIfNeeded();

        // Create Gmail API client
        const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

        // Create MIME message
        const rawMessage = this.createMimeMessage(params);

        // Send email
        const response = await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: rawMessage,
          },
        });

        return {
          success: true,
          messageId: response.data.id || undefined,
        };
      } catch (error) {
        lastError = error as Error;
        console.error(`Gmail send attempt ${attempt + 1} failed:`, error);

        // Check if it's a token error that might be fixed by refresh
        const errorMessage = (error as Error).message || '';
        if (errorMessage.includes('invalid_grant') || errorMessage.includes('Token has been expired')) {
          // Token expired, try to refresh
          try {
            await this.refreshTokenIfNeeded();
          } catch {
            // Refresh failed, continue to retry
          }
        }

        // Wait before retry (exponential backoff)
        if (attempt < RETRY_CONFIG.maxRetries - 1) {
          const delay = Math.min(
            RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
            RETRY_CONFIG.maxDelay
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    return {
      success: false,
      error: lastError?.message || 'Failed to send email after multiple attempts',
    };
  }
}

// Singleton instance
export const gmailEmailService = new GmailEmailService();
