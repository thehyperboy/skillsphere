package com.skillsphere.controller;

import com.skillsphere.entity.Certificate;
import com.skillsphere.service.CertificateService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/certificates")
public class CertificateController {

    private final CertificateService certificateService;

    public CertificateController(CertificateService certificateService) {
        this.certificateService = certificateService;
    }

    @PostMapping("/generate")
    public ResponseEntity<Certificate> generateCertificate(
            @RequestParam Long studentId,
            @RequestParam Long courseId) {
        return ResponseEntity.ok(certificateService.generateCertificateRecord(studentId, courseId));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<java.util.List<Certificate>> getStudentCertificates(@PathVariable Long studentId) {
        return ResponseEntity.ok(certificateService.getCertificatesByStudentId(studentId));
    }

    @GetMapping("/download/{verificationCode}")
    public ResponseEntity<byte[]> downloadCertificate(@PathVariable String verificationCode) {
        byte[] pdfBytes = certificateService.generateCertificatePdf(verificationCode);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "skillsphere-certificate-" + verificationCode + ".pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
