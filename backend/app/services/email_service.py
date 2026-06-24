import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def send_email(to_email: str, subject: str, body_html: str, body_text: str = "") -> bool:
    """
    Sends an email using the SMTP settings from the configuration.
    Returns True if successful, False otherwise.
    Does not crash the request flow if SMTP configuration is missing or errors out.
    """
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print("[Email Service] SMTP configuration is incomplete. Skipping email sending.")
        print(f"[Email Service Mock] To: {to_email} | Subject: {subject}")
        print(f"[Email Service Mock] Plain Text Body: {body_text or body_html}")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
        msg["To"] = to_email

        if body_text:
            msg.attach(MIMEText(body_text, "plain"))
        msg.attach(MIMEText(body_html, "html"))

        # Setup SMTP connection
        port = settings.SMTP_PORT or 587
        server = smtplib.SMTP(settings.SMTP_HOST, port)
        server.ehlo()
        # Enable security if port is standard secure ports
        if port == 587 or port == 25:
            server.starttls()
            server.ehlo()
        
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(msg["From"], [to_email], msg.as_string())
        server.close()
        print(f"[Email Service] Email successfully sent to {to_email}")
        return True
    except Exception as e:
        print(f"[Email Service] Failed to send email to {to_email}: {str(e)}")
        return False

def send_password_reset_email(to_email: str, reset_link: str) -> bool:
    """
    Helper to send a password reset link to user.
    """
    subject = "Reset Your DaleIQ Password"
    body_text = f"Hello,\n\nPlease reset your password by clicking on the link below:\n{reset_link}\n\nThis link is valid for 1 hour.\nIf you did not request this, please ignore this email."
    
    body_html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #4F46E5; text-align: center;">Reset Your DaleIQ Password</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. You can do so by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_link}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p>This link is valid for 1 hour. If you did not request this reset, no action is needed.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888;">If the button above does not work, copy and paste this URL into your browser:</p>
          <p style="font-size: 12px; color: #4F46E5; word-break: break-all;">{reset_link}</p>
        </div>
      </body>
    </html>
    """
    return send_email(to_email, subject, body_html, body_text)

def send_verification_email(to_email: str, verification_code: str) -> bool:
    """
    Helper to send a 6-digit verification code to user email.
    """
    subject = "Verify Your DaleIQ Account"
    body_text = f"Hello,\n\nPlease verify your email address by entering the following 6-digit code in the application:\n\n{verification_code}\n\nThis code is valid for 24 hours."
    
    body_html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #4F46E5; text-align: center;">Verify Your Email Address</h2>
          <p>Hello,</p>
          <p>Thank you for registering. Please enter the following 6-digit code to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #F3F4F6; border: 2px dashed #4F46E5; color: #4F46E5; padding: 15px 30px; border-radius: 6px; font-weight: bold; font-size: 24px; letter-spacing: 5px; display: inline-block;">
              {verification_code}
            </div>
          </div>
          <p>This code is valid for 24 hours. Do not share it with anyone.</p>
        </div>
      </body>
    </html>
    """
    return send_email(to_email, subject, body_html, body_text)
