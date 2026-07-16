package com.skillsphere.service;

import com.skillsphere.dto.AuthRequest;
import com.skillsphere.dto.AuthResponse;
import com.skillsphere.dto.RegisterRequest;
import com.skillsphere.entity.User;
import com.skillsphere.repository.UserRepository;
import com.skillsphere.security.JwtUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    public AuthResponse authenticate(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password credentials");
        }

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole(), user.getFullName());
        return new AuthResponse(user.getId(), token, user.getEmail(), user.getFullName(), user.getRole());
    }

    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setFullName(request.getName());
        user.setEmail(request.getEmail());
        user.setUsername(request.getEmail().split("@")[0]);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        
        // Default to student if role not provided
        String assignedRole = request.getRole() != null ? request.getRole() : "ROLE_STUDENT";
        user.setRole(assignedRole);

        userRepository.save(user);
    }
}
