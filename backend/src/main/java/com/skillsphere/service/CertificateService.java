package com.skillsphere.service;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Paragraph;
import com.lowagie.text.PageSize;
import com.lowagie.text.pdf.PdfWriter;
import com.skillsphere.entity.Certificate;
import com.skillsphere.entity.Course;
import com.skillsphere.entity.User;
import com.skillsphere.repository.CertificateRepository;
import com.skillsphere.repository.CourseRepository;
import com.skillsphere.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    public CertificateService(CertificateRepository certificateRepository, UserRepository userRepository, CourseRepository courseRepository) {
        this.certificateRepository = certificateRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
    }

    public java.util.List<Certificate> getCertificatesByStudentId(Long studentId) {
        return certificateRepository.findByStudentId(studentId);
    }

    public Certificate generateCertificateRecord(Long studentId, Long courseId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        return certificateRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseGet(() -> {
                    Certificate certificate = new Certificate();
                    certificate.setStudent(student);
                    certificate.setCourse(course);
                    certificate.setVerificationCode(UUID.randomUUID().toString());
                    return certificateRepository.save(certificate);
                });
    }

    public byte[] generateCertificatePdf(String verificationCode) {
        Certificate certificate = certificateRepository.findByVerificationCode(verificationCode)
                .orElseThrow(() -> new RuntimeException("Invalid certificate code"));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate(), 50, 50, 50, 50);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Font configurations
            Font titleFont = new Font(Font.HELVETICA, 32, Font.BOLD, new Color(99, 102, 241));
            Font subtitleFont = new Font(Font.HELVETICA, 16, Font.ITALIC, Color.DARK_GRAY);
            Font bodyFont = new Font(Font.HELVETICA, 20, Font.BOLD, Color.BLACK);
            Font courseFont = new Font(Font.HELVETICA, 24, Font.BOLD, new Color(236, 72, 153));
            Font metaFont = new Font(Font.COURIER, 10, Font.NORMAL, Color.GRAY);

            // Add Margin Spacing
            Paragraph spacer = new Paragraph(" ");
            spacer.setSpacingAfter(40);
            document.add(spacer);

            // Main Title
            Paragraph title = new Paragraph("CERTIFICATE OF COMPLETION", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(30);
            document.add(title);

            // Subtitle text
            Paragraph subtitle = new Paragraph("This official credential verifies that", subtitleFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(20);
            document.add(subtitle);

            // Student Full Name
            Paragraph studentName = new Paragraph(certificate.getStudent().getFullName().toUpperCase(), bodyFont);
            studentName.setAlignment(Element.ALIGN_CENTER);
            studentName.setSpacingAfter(20);
            document.add(studentName);

            // Statement
            Paragraph statement = new Paragraph("has successfully completed proficiency requirements for", subtitleFont);
            statement.setAlignment(Element.ALIGN_CENTER);
            statement.setSpacingAfter(20);
            document.add(statement);

            // Course Title
            Paragraph courseTitle = new Paragraph(certificate.getCourse().getTitle(), courseFont);
            courseTitle.setAlignment(Element.ALIGN_CENTER);
            courseTitle.setSpacingAfter(40);
            document.add(courseTitle);

            // Metadata footer
            String formattedDate = certificate.getIssuedAt().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"));
            Paragraph footer = new Paragraph(
                    "Verification UUID: " + certificate.getVerificationCode() + "\n" +
                    "Issued Date: " + formattedDate + " | Verified via SkillSphere Enterprise Core Engine",
                    metaFont
            );
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("PDF compilation failed: " + e.getMessage());
        }

        return out.toByteArray();
    }
}
