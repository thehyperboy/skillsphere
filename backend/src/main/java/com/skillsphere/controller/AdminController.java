package com.skillsphere.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.skillsphere.entity.User;
import com.skillsphere.repository.UserRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;

    public AdminController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getSystemMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("cpuUsage", "12.4%");
        metrics.put("memoryTotal", "4096MB");
        metrics.put("memoryUsed", "1024MB");
        metrics.put("dbConnections", 12);
        metrics.put("activeSessionTokens", 145);
        return ResponseEntity.ok(metrics);
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping("/users/{userId}/role")
    public ResponseEntity<Map<String, String>> changeUserRole(
            @PathVariable Long userId,
            @RequestParam String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(role);
        userRepository.save(user);

        Map<String, String> response = new HashMap<>();
        response.put("message", "User ID " + userId + " successfully updated to role: " + role);
        return ResponseEntity.ok(response);
    }
}
