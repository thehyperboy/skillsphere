package com.skillsphere.service;

import com.skillsphere.dto.CourseDTO;
import com.skillsphere.entity.Course;
import com.skillsphere.entity.User;
import com.skillsphere.repository.CourseRepository;
import com.skillsphere.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public CourseService(CourseRepository courseRepository, UserRepository userRepository) {
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public Course getCourseById(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
    }

    public Course createCourse(CourseDTO dto) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User instructor = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Instructor not found"));

        Course course = new Course();
        course.setTitle(dto.getTitle());
        course.setDescription(dto.getDescription());
        course.setCategory(dto.getCategory());
        course.setDifficulty(dto.getDifficulty());
        course.setDuration(dto.getDuration());
        course.setInstructor(instructor);
        course.setThumbnail("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60");

        return courseRepository.save(course);
    }
}
