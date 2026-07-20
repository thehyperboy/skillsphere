package com.skillsphere.config;

import com.skillsphere.entity.User;
import com.skillsphere.repository.UserRepository;
import com.skillsphere.security.JwtUtils;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Handles successful OAuth2 login:
 * 1. Extracts user info from the OAuth2 principal
 * 2. Creates or finds the user in the database
 * 3. Generates a JWT token
 * 4. Redirects to the frontend with the JWT as a query parameter
 *
 * Frontend receives: http://localhost:5173/?token=JWT&role=ROLE_STUDENT&name=John
 */
@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${skillsphere.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public OAuth2SuccessHandler(JwtUtils jwtUtils, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        // Extract email and name — works for both Google and GitHub
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        // GitHub may not expose email directly; fall back to login username
        if (email == null) {
            email = oAuth2User.getAttribute("login") + "@github.local";
        }
        if (name == null) {
            name = oAuth2User.getAttribute("login");
        }

        final String finalEmail = email;
        final String finalName = name != null ? name : "OAuth User";

        // Create or find user in database
        User user = userRepository.findByEmail(finalEmail).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(finalEmail);
            newUser.setFullName(finalName);
            newUser.setUsername(finalEmail.split("@")[0]);
            newUser.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
            newUser.setRole("ROLE_STUDENT");
            newUser.setActive(true);
            return userRepository.save(newUser);
        });

        // Generate JWT
        String token = jwtUtils.generateToken(user.getEmail(), user.getRole(), user.getFullName());

        // Redirect to frontend with token + user info as query params
        String redirectUrl = frontendUrl + "/?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8)
                + "&role=" + URLEncoder.encode(user.getRole(), StandardCharsets.UTF_8)
                + "&name=" + URLEncoder.encode(user.getFullName(), StandardCharsets.UTF_8)
                + "&email=" + URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8)
                + "&id=" + user.getId();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
