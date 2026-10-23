package vhuwng.itisacademy.Mail;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String from;

    public EmailService(JavaMailSender mailSender, @Value("${app.mail.from}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    @Async
    public void sendPasswordResetOtp(String toEmail, String otp, long expirationMinutes) {
        String subject = "[ITIS Academy] Password reset OTP";
        String html = """
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                  <h2 style="color: #1f2937;">Reset your password</h2>
                  <p>You requested a password reset for your ITIS Academy account. Use the OTP below to continue:</p>
                  <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #2563eb; text-align: center; padding: 12px; background: #f3f4f6; border-radius: 8px;">%s</p>
                  <p>This code expires in <strong>%d minutes</strong>. If you did not request this, you can ignore this email.</p>
                </div>
                """.formatted(otp, expirationMinutes);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
        } catch (MessagingException | MailException e) {
            throw new IllegalStateException("Failed to send OTP email", e);
        }
    }
}
