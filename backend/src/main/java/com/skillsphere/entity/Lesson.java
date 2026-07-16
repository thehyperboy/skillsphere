package com.skillsphere.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "lessons")
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String videoUrl;
    
    @Column(columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private CourseModule module;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public CourseModule getModule() { return module; }
    public void setModule(CourseModule module) { this.module = module; }
}
