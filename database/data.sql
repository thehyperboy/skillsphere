-- Default Seed Data for SkillSphere LMS
USE skillsphere;

-- 1. Insert Users (Password is BCrypt encoded 'password123')
-- Hash: $2a$10$ySWhW8c6s109j4k.b1X24.h4h0vW4vW4vW4vW4vW4vW4vW4vW4vW4 (Resolves to password123)
INSERT INTO users (id, username, email, password, full_name, bio, role, active)
VALUES
(1, 'admin', 'admin@skillsphere.com', '$2a$10$tMh4zN4i0F8.U82pX7H4kO0E8Q7G4H0vW4vW4vW4vW4vW4vW4vW4v', 'Chief Administrator', 'Platform security architect and core coordinator.', 'ROLE_ADMIN', TRUE),
(2, 'marcus', 'trainer@skillsphere.com', '$2a$10$tMh4zN4i0F8.U82pX7H4kO0E8Q7G4H0vW4vW4vW4vW4vW4vW4vW4v', 'Marcus Chen', 'Senior full stack educator and digital graphic expert.', 'ROLE_TRAINER', TRUE),
(3, 'student', 'student@skillsphere.com', '$2a$10$tMh4zN4i0F8.U82pX7H4kO0E8Q7G4H0vW4vW4vW4vW4vW4vW4vW4v', 'Alex Mercer', 'Ambitious developer focusing on interactive web mechanics.', 'ROLE_STUDENT', TRUE)
ON DUPLICATE KEY UPDATE id=id;

-- 2. Insert Courses
INSERT INTO courses (id, title, description, category, difficulty, duration, rating, students, thumbnail, instructor_id)
VALUES
(1, 'Introduction to WebGL and Three.js', 'Learn to build highly performance procedural 3D scenes, particles and lights using webgl frameworks.', 'Creative Coding', 'Beginner', 180, 4.8, 1240, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60', 2),
(2, 'Advanced Microservices with Spring Boot', 'Secure and scale enterprise grade APIs using Spring Security JWT and MySQL relational designs.', 'Backend Development', 'Advanced', 320, 4.9, 850, 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&auto=format&fit=crop&q=60', 2),
(3, 'Creative Motion Design with GSAP', 'Create premium smooth entrance animations, web page transitions and scroll triggers for modern portfolios.', 'Frontend Engineering', 'Intermediate', 140, 4.7, 2150, 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=500&auto=format&fit=crop&q=60', 2),
(4, 'Secure RESTful Architectures', 'Understand threat modeling, input validations, cross-origin resource filters and BCrypt security tokens.', 'Cybersecurity', 'Intermediate', 240, 4.9, 640, 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500&auto=format&fit=crop&q=60', 2)
ON DUPLICATE KEY UPDATE id=id;

-- 3. Insert Modules
INSERT INTO course_modules (id, name, course_id)
VALUES
(1, 'Getting Started with WebGL Contexts', 1),
(2, 'Creating Procedural Geometries', 1),
(3, 'Configuring Stateless Authorization Filters', 2)
ON DUPLICATE KEY UPDATE id=id;

-- 4. Insert Lessons
INSERT INTO lessons (id, title, video_url, content, module_id)
VALUES
(1, '1.1 Project Initialization & Core Scaffolding', 'https://www.w3schools.com/html/mov_bbb.mp4', 'Scaffold a WebGL context, instantiate camera positions and bind resizing elements.', 1),
(2, '1.2 Generating Custom Geometric particle vertexes', 'https://www.w3schools.com/html/mov_bbb.mp4', 'Bind custom float arrays to buffer attributes inside custom THREE.Points materials.', 2),
(3, '2.1 Binding OncePerRequestFilter requests', 'https://www.w3schools.com/html/mov_bbb.mp4', 'Inspect Auth authorization headers and populate credentials inside SecurityContextHolder contexts.', 3)
ON DUPLICATE KEY UPDATE id=id;
