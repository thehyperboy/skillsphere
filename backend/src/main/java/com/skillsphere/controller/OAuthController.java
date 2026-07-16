package com.skillsphere.controller;

import com.skillsphere.dto.AuthResponse;
import com.skillsphere.dto.GoogleLoginRequest;
import com.skillsphere.dto.GithubLoginRequest;
import com.skillsphere.entity.User;
import com.skillsphere.repository.UserRepository;
import com.skillsphere.security.JwtUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class OAuthController {

    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final PasswordEncoder passwordEncoder;
    private final RestTemplate restTemplate;

    @Value("${skillsphere.oauth.github.client-id:}")
    private String githubClientId;

    @Value("${skillsphere.oauth.github.client-secret:}")
    private String githubClientSecret;

    public OAuthController(UserRepository userRepository, JwtUtils jwtUtils, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
        this.passwordEncoder = passwordEncoder;
        this.restTemplate = new RestTemplate();
    }

    @PostMapping("/google")
    public ResponseEntity<?> loginWithGoogle(@RequestBody GoogleLoginRequest request) {
        try {
            // Fetch Google userinfo using access_token
            String googleUrl = "https://www.googleapis.com/oauth2/v3/userinfo?access_token=" + request.getToken();
            ResponseEntity<Map> response = restTemplate.getForEntity(googleUrl, Map.class);
            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid Google Token"));
            }

            Map<String, Object> body = response.getBody();
            String email = (String) body.get("email");
            String name = (String) body.get("name");

            if (email == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Google account email not found"));
            }

            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                user = new User();
                user.setEmail(email);
                user.setFullName(name != null ? name : "Google Scholar");
                user.setUsername(email.split("@")[0]);
                user.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
                user.setRole("ROLE_STUDENT");
                user.setActive(true);
                user = userRepository.save(user);
            }

            String token = jwtUtils.generateToken(user.getEmail(), user.getRole(), user.getFullName());
            return ResponseEntity.ok(new AuthResponse(user.getId(), token, user.getEmail(), user.getFullName(), user.getRole()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/github")
    public ResponseEntity<?> loginWithGithub(@RequestBody GithubLoginRequest request) {
        try {
            // Exchange code for Access Token
            String tokenUrl = "https://github.com/login/oauth/access_token";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));

            Map<String, String> tokenParams = Map.of(
                "client_id", githubClientId,
                "client_secret", githubClientSecret,
                "code", request.getCode()
            );

            HttpEntity<Map<String, String>> tokenRequest = new HttpEntity<>(tokenParams, headers);
            ResponseEntity<Map> tokenResponse = restTemplate.postForEntity(tokenUrl, tokenRequest, Map.class);
            if (tokenResponse.getStatusCode() != HttpStatus.OK || tokenResponse.getBody() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Failed to exchange GitHub authorization code"));
            }

            String accessToken = (String) tokenResponse.getBody().get("access_token");
            if (accessToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "GitHub access token not granted"));
            }

            // Fetch GitHub Profile details
            HttpHeaders profileHeaders = new HttpHeaders();
            profileHeaders.setBearerAuth(accessToken);
            profileHeaders.set("User-Agent", "SkillSphere");
            HttpEntity<Void> profileRequest = new HttpEntity<>(profileHeaders);

            ResponseEntity<Map> profileResponse = restTemplate.exchange(
                "https://api.github.com/user",
                HttpMethod.GET,
                profileRequest,
                Map.class
            );

            if (profileResponse.getStatusCode() != HttpStatus.OK || profileResponse.getBody() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Failed to load GitHub user profile"));
            }

            Map<String, Object> profileBody = profileResponse.getBody();
            String email = (String) profileBody.get("email");
            String name = (String) profileBody.get("name");
            String username = (String) profileBody.get("login");

            // If email is private, fetch via user emails endpoint
            if (email == null) {
                ResponseEntity<List> emailsResponse = restTemplate.exchange(
                    "https://api.github.com/user/emails",
                    HttpMethod.GET,
                    profileRequest,
                    List.class
                );
                if (emailsResponse.getStatusCode() == HttpStatus.OK && emailsResponse.getBody() != null) {
                    for (Object emailObj : emailsResponse.getBody()) {
                        if (emailObj instanceof Map) {
                            Map emailMap = (Map) emailObj;
                            if (Boolean.TRUE.equals(emailMap.get("primary")) || email == null) {
                                email = (String) emailMap.get("email");
                            }
                        }
                    }
                }
            }

            if (email == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "GitHub account email not found"));
            }

            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                user = new User();
                user.setEmail(email);
                user.setFullName(name != null ? name : (username != null ? username : "Octocat Coder"));
                user.setUsername(username != null ? username : email.split("@")[0]);
                user.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
                user.setRole("ROLE_STUDENT");
                user.setActive(true);
                user = userRepository.save(user);
            }

            String token = jwtUtils.generateToken(user.getEmail(), user.getRole(), user.getFullName());
            return ResponseEntity.ok(new AuthResponse(user.getId(), token, user.getEmail(), user.getFullName(), user.getRole()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
