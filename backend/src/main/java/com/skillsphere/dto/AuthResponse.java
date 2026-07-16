package com.skillsphere.dto;

public class AuthResponse {
    private Long id;
    private String token;
    private String email;
    private String name;
    private String role;

    public AuthResponse(Long id, String token, String email, String name, String role) {
        this.id = id;
        this.token = token;
        this.email = email;
        this.name = name;
        this.role = role;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    // Getters and Setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
