package com.skillsphere.repository;

import com.skillsphere.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    Optional<Certificate> findByVerificationCode(String verificationCode);
    Optional<Certificate> findByStudentIdAndCourseId(Long studentId, Long courseId);
    java.util.List<Certificate> findByStudentId(Long studentId);
}
