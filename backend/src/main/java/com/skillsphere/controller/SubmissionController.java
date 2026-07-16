package com.skillsphere.controller;

import com.skillsphere.dto.SubmissionDTO;
import com.skillsphere.entity.Submission;
import com.skillsphere.service.SubmissionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/submissions")
public class SubmissionController {

    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @PostMapping
    public ResponseEntity<Submission> submitAssignment(@Valid @RequestBody SubmissionDTO dto) {
        return ResponseEntity.ok(submissionService.createSubmission(dto));
    }

    @GetMapping
    public ResponseEntity<List<Submission>> getAllSubmissions() {
        return ResponseEntity.ok(submissionService.getAllSubmissions());
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Submission>> getSubmissionsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(submissionService.getSubmissionsByStudent(studentId));
    }

    @PutMapping("/{id}/grade")
    public ResponseEntity<Submission> gradeSubmission(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String grade = payload.get("grade");
        String feedback = payload.get("feedback");
        return ResponseEntity.ok(submissionService.gradeSubmission(id, grade, feedback));
    }
}
