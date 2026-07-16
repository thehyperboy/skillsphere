package com.skillsphere.service;

import com.skillsphere.dto.SubmissionDTO;
import com.skillsphere.entity.Certificate;
import com.skillsphere.entity.Course;
import com.skillsphere.entity.Submission;
import com.skillsphere.entity.User;
import com.skillsphere.repository.CourseRepository;
import com.skillsphere.repository.SubmissionRepository;
import com.skillsphere.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final CertificateService certificateService;

    public SubmissionService(SubmissionRepository submissionRepository,
                             UserRepository userRepository,
                             CourseRepository courseRepository,
                             CertificateService certificateService) {
        this.submissionRepository = submissionRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.certificateService = certificateService;
    }

    @Transactional
    public Submission createSubmission(SubmissionDTO dto) {
        User student = userRepository.findById(dto.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student not found"));
        Course course = courseRepository.findById(dto.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));

        Submission submission = new Submission();
        submission.setStudent(student);
        submission.setCourse(course);
        submission.setSubmissionFile(dto.getSubmissionFile());
        submission.setGrade("Pending");
        submission.setFeedback("Waiting for review");
        submission.setStatus("Submitted");

        return submissionRepository.save(submission);
    }

    public List<Submission> getAllSubmissions() {
        return submissionRepository.findAll();
    }

    public List<Submission> getSubmissionsByStudent(Long studentId) {
        return submissionRepository.findByStudentId(studentId);
    }

    @Transactional
    public Submission gradeSubmission(Long submissionId, String grade, String feedback) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        submission.setGrade(grade);
        submission.setFeedback(feedback);
        submission.setStatus("Approved");

        Submission saved = submissionRepository.save(submission);

        // Auto-generate certificate if passing grade is given
        if (grade != null && !grade.trim().isEmpty() && !grade.equalsIgnoreCase("Pending")) {
            certificateService.generateCertificateRecord(
                    submission.getStudent().getId(),
                    submission.getCourse().getId()
            );
        }

        return saved;
    }
}
