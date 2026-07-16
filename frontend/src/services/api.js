const API_BASE_URL = 'http://localhost:8080/api';

const useMock = true; // Set to false when backend is running

const initialMockData = {
  courses: [
    {
      id: 1,
      title: 'Introduction to WebGL and Three.js',
      instructor: 'Dr. Sarah Jenkins',
      category: 'Creative Coding',
      difficulty: 'Beginner',
      duration: 180,
      rating: 4.8,
      students: 1240,
      progress: 60,
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 2,
      title: 'Advanced Microservices with Spring Boot',
      instructor: 'Marcus Chen',
      category: 'Backend Development',
      difficulty: 'Advanced',
      duration: 320,
      rating: 4.9,
      students: 850,
      progress: 10,
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 3,
      title: 'Creative Motion Design with GSAP',
      instructor: 'Elena Rostova',
      category: 'Frontend Engineering',
      difficulty: 'Intermediate',
      duration: 140,
      rating: 4.7,
      students: 2150,
      progress: 0,
      thumbnail: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 4,
      title: 'Secure RESTful Architectures',
      instructor: 'Marcus Chen',
      category: 'Cybersecurity',
      difficulty: 'Intermediate',
      duration: 240,
      rating: 4.9,
      students: 640,
      progress: 100,
      thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 5,
      title: 'Machine Learning Fundamentals',
      instructor: 'Dr. Aisha Patel',
      category: 'Data Science',
      difficulty: 'Intermediate',
      duration: 280,
      rating: 4.6,
      students: 1820,
      progress: 0,
      thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 6,
      title: 'React & Next.js Mastery',
      instructor: 'Liam Sterling',
      category: 'Frontend Engineering',
      difficulty: 'Intermediate',
      duration: 200,
      rating: 4.8,
      students: 3100,
      progress: 0,
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500&auto=format&fit=crop&q=60'
    },
  ],
  discussions: [
    { id: 1, title: 'How to optimize particle count in Three.js?', author: 'John Doe', replies: 8, likes: 24, date: '2 hours ago' },
    { id: 2, title: 'Best practices for Spring Boot JWT validation filters', author: 'Jane Smith', replies: 12, likes: 45, date: '1 day ago' },
    { id: 3, title: 'GSAP ScrollTrigger with React - tips?', author: 'Alex Mercer', replies: 5, likes: 18, date: '3 days ago' },
  ],
  notifications: [
    { id: 1, title: 'Assignment Due', message: 'Three.js 3D Sandbox is due tomorrow.', type: 'alert' },
    { id: 2, title: 'New Course Announcement', message: 'Marcus Chen released a new Spring Boot course!', type: 'info' }
  ],
  submissions: [
    {
      id: 1,
      studentName: 'Alice Miller',
      courseTitle: 'Introduction to WebGL and Three.js',
      courseId: 1,
      submissionFile: 'sandbox-project.zip',
      grade: 'A',
      feedback: 'Amazing 3D shader work!',
      status: 'Approved'
    }
  ],
  users: [
    { id: 1, fullName: 'Chief Administrator', email: 'admin@skillsphere.com', role: 'ROLE_ADMIN' },
    { id: 2, fullName: 'Marcus Chen', email: 'trainer@skillsphere.com', role: 'ROLE_TRAINER' },
    { id: 3, fullName: 'Alex Mercer', email: 'student@skillsphere.com', role: 'ROLE_STUDENT' },
    { id: 4, fullName: 'Alice Miller', email: 'alice@skillsphere.com', role: 'ROLE_STUDENT' },
    { id: 5, fullName: 'Elena Rostova', email: 'trainer2@skillsphere.com', role: 'ROLE_TRAINER' },
  ]
};

// Seed localStorage if not present
if (!localStorage.getItem('skillsphere_courses')) {
  localStorage.setItem('skillsphere_courses', JSON.stringify(initialMockData.courses));
}
if (!localStorage.getItem('skillsphere_discussions')) {
  localStorage.setItem('skillsphere_discussions', JSON.stringify(initialMockData.discussions));
}
if (!localStorage.getItem('skillsphere_notifications')) {
  localStorage.setItem('skillsphere_notifications', JSON.stringify(initialMockData.notifications));
}
if (!localStorage.getItem('skillsphere_submissions')) {
  localStorage.setItem('skillsphere_submissions', JSON.stringify(initialMockData.submissions));
}
if (!localStorage.getItem('skillsphere_users')) {
  localStorage.setItem('skillsphere_users', JSON.stringify(initialMockData.users));
}

export const api = {
  // Authentication
  async login(email, password) {
    if (useMock) {
      const users = JSON.parse(localStorage.getItem('skillsphere_users'));
      const user = users.find(u => u.email === email);
      if (!user) throw new Error('Invalid email or password');
      const mockUser = { id: user.id, token: 'mock-jwt-token-xyz', email: user.email, name: user.fullName, role: user.role };
      localStorage.setItem('skillsphere_auth', JSON.stringify(mockUser));
      return mockUser;
    }

    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Invalid email or password');
    const data = await res.json();
    localStorage.setItem('skillsphere_auth', JSON.stringify(data));
    return data;
  },

  async register(name, email, password, role) {
    if (useMock) {
      const users = JSON.parse(localStorage.getItem('skillsphere_users'));
      const existing = users.find(u => u.email === email);
      if (existing) throw new Error('An account with this email already exists');
      const newUser = { id: users.length + 1, fullName: name, email, role };
      users.push(newUser);
      localStorage.setItem('skillsphere_users', JSON.stringify(users));
      return { message: 'Registration successful! Please log in.' };
    }
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    if (!res.ok) throw new Error('Registration failed. Please try again.');
    return await res.json();
  },

  async loginOAuth(provider) {
    if (useMock) {
      const email = provider === 'google' ? 'google.user@gmail.com' : 'github.user@github.com';
      const name = provider === 'google' ? 'Google Scholar' : 'Octocat Coder';
      const role = 'ROLE_STUDENT';
      const users = JSON.parse(localStorage.getItem('skillsphere_users'));
      let user = users.find(u => u.email === email);
      if (!user) {
        user = { id: users.length + 1, fullName: name, email, role };
        users.push(user);
        localStorage.setItem('skillsphere_users', JSON.stringify(users));
      }
      const mockUser = { id: user.id, token: 'mock-oauth-token', email, name, role };
      localStorage.setItem('skillsphere_auth', JSON.stringify(mockUser));
      return mockUser;
    }
    const email = provider === 'google' ? 'google.student@skillsphere.com' : 'github.student@skillsphere.com';
    const name = provider === 'google' ? 'Google Scholar' : 'Octocat Coder';
    const password = 'OAuthSecurePass123!';
    try {
      await this.register(name, email, password, 'ROLE_STUDENT');
    } catch (err) {
      // User might already exist, continue to login
    }
    return await this.login(email, password);
  },

  logout() {
    localStorage.removeItem('skillsphere_auth');
  },

  getUser() {
    const auth = localStorage.getItem('skillsphere_auth');
    return auth ? JSON.parse(auth) : null;
  },

  // Courses
  async getCourses() {
    if (useMock) {
      return JSON.parse(localStorage.getItem('skillsphere_courses'));
    }
    const auth = this.getUser();
    const res = await fetch(`${API_BASE_URL}/courses`, {
      headers: { 'Authorization': `Bearer ${auth?.token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch courses');
    return await res.json();
  },

  async addCourse(course) {
    if (useMock) {
      const courses = JSON.parse(localStorage.getItem('skillsphere_courses'));
      const newCourse = {
        id: courses.length + 1,
        ...course,
        students: 0,
        rating: 5.0,
        progress: 0,
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60'
      };
      courses.push(newCourse);
      localStorage.setItem('skillsphere_courses', JSON.stringify(courses));
      return newCourse;
    }
    const auth = this.getUser();
    const res = await fetch(`${API_BASE_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth?.token}`
      },
      body: JSON.stringify(course)
    });
    if (!res.ok) throw new Error('Failed to create course');
    return await res.json();
  },

  // Quizzes / Leaderboard
  async getLeaderboard() {
    return [
      { rank: 1, name: 'Alice Miller', score: 980 },
      { rank: 2, name: 'Jane Smith', score: 920 },
      { rank: 3, name: 'Alex Mercer', score: 890 },
      { rank: 4, name: 'John Doe', score: 850 }
    ];
  },

  // Discussions (always localStorage-backed for now)
  async getDiscussions() {
    return JSON.parse(localStorage.getItem('skillsphere_discussions'));
  },

  async addDiscussion(title, author) {
    const list = JSON.parse(localStorage.getItem('skillsphere_discussions'));
    const newItem = { id: list.length + 1, title, author, replies: 0, likes: 0, date: 'Just now' };
    list.unshift(newItem);
    localStorage.setItem('skillsphere_discussions', JSON.stringify(list));
    return newItem;
  },

  // Submissions
  async getSubmissions() {
    if (useMock) {
      return JSON.parse(localStorage.getItem('skillsphere_submissions'));
    }
    const auth = this.getUser();
    const res = await fetch(`${API_BASE_URL}/submissions`, {
      headers: { 'Authorization': `Bearer ${auth?.token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch submissions');
    return await res.json();
  },

  async getStudentSubmissions(studentId) {
    if (useMock) {
      const all = JSON.parse(localStorage.getItem('skillsphere_submissions')) || [];
      return all;
    }
    const auth = this.getUser();
    const res = await fetch(`${API_BASE_URL}/submissions/student/${studentId}`, {
      headers: { 'Authorization': `Bearer ${auth?.token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch student submissions');
    return await res.json();
  },

  async submitAssignment(studentId, courseId, submissionFile) {
    if (useMock) {
      const list = JSON.parse(localStorage.getItem('skillsphere_submissions'));
      const auth = this.getUser();
      const courses = JSON.parse(localStorage.getItem('skillsphere_courses'));
      const course = courses.find(c => c.id === courseId);
      const newItem = {
        id: list.length + 1,
        studentName: auth?.name || 'Student',
        courseTitle: course?.title || 'Unknown Course',
        courseId,
        submissionFile,
        grade: 'Pending',
        feedback: 'Awaiting trainer review',
        status: 'Submitted'
      };
      list.push(newItem);
      localStorage.setItem('skillsphere_submissions', JSON.stringify(list));
      return newItem;
    }
    const auth = this.getUser();
    const res = await fetch(`${API_BASE_URL}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth?.token}`
      },
      body: JSON.stringify({ studentId, courseId, submissionFile })
    });
    if (!res.ok) throw new Error('Failed to submit assignment');
    return await res.json();
  },

  async gradeSubmission(id, grade, feedback) {
    if (useMock) {
      const list = JSON.parse(localStorage.getItem('skillsphere_submissions'));
      const index = list.findIndex(s => s.id === parseInt(id));
      if (index !== -1) {
        list[index].grade = grade;
        list[index].feedback = feedback;
        list[index].status = 'Approved';
        localStorage.setItem('skillsphere_submissions', JSON.stringify(list));
      }
      return list[index] || {};
    }
    const auth = this.getUser();
    const res = await fetch(`${API_BASE_URL}/submissions/${id}/grade`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth?.token}`
      },
      body: JSON.stringify({ grade, feedback })
    });
    if (!res.ok) throw new Error('Failed to grade submission');
    return await res.json();
  },

  // Certificates
  async getStudentCertificates(studentId) {
    if (useMock) {
      // Return a certificate for completed submissions (grade !== Pending)
      const subs = JSON.parse(localStorage.getItem('skillsphere_submissions')) || [];
      const courses = JSON.parse(localStorage.getItem('skillsphere_courses'));
      return subs
        .filter(s => s.grade && s.grade !== 'Pending' && s.grade !== 'F')
        .map((s, i) => {
          const course = courses.find(c => c.id === s.courseId);
          return {
            id: i + 1,
            verificationCode: `SS-${studentId}-${s.courseId}-${Date.now().toString(36).toUpperCase()}`,
            issuedAt: new Date().toISOString(),
            course: course ? { id: course.id, title: course.title } : { id: s.courseId, title: s.courseTitle }
          };
        });
    }
    const auth = this.getUser();
    const res = await fetch(`${API_BASE_URL}/certificates/student/${studentId}`, {
      headers: { 'Authorization': `Bearer ${auth?.token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch certificates');
    return await res.json();
  },

  // Admin
  async getAdminUsers() {
    if (useMock) {
      return JSON.parse(localStorage.getItem('skillsphere_users'));
    }
    const auth = this.getUser();
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: { 'Authorization': `Bearer ${auth?.token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return await res.json();
  },

  async updateUserRole(userId, role) {
    if (useMock) {
      const users = JSON.parse(localStorage.getItem('skillsphere_users'));
      const index = users.findIndex(u => u.id === parseInt(userId));
      if (index !== -1) {
        users[index].role = role;
        localStorage.setItem('skillsphere_users', JSON.stringify(users));
      }
      return users[index] || {};
    }
    const auth = this.getUser();
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/role?role=${encodeURIComponent(role)}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${auth?.token}` }
    });
    if (!res.ok) throw new Error('Failed to update user role');
    return await res.json();
  },

  async loginWithGoogleToken(token) {
    if (useMock) return this.loginOAuth('google');
    const res = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    if (!res.ok) throw new Error('Google login failed');
    const data = await res.json();
    localStorage.setItem('skillsphere_auth', JSON.stringify(data));
    return data;
  },

  async loginWithGithubCode(code) {
    if (useMock) return this.loginOAuth('github');
    const res = await fetch(`${API_BASE_URL}/auth/github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    if (!res.ok) throw new Error('GitHub login failed');
    const data = await res.json();
    localStorage.setItem('skillsphere_auth', JSON.stringify(data));
    return data;
  },

  async redirectToGoogle() {
    if (useMock) {
      return await this.loginOAuth('google');
    }
    const clientId = '927599026365-c7hgg6b00vldtq022k57c2k81tmdvein.apps.googleusercontent.com';
    const redirectUri = window.location.origin + '/';
    const scope = 'openid email profile';
    const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}&state=google`;
    window.location.href = googleUrl;
    return null;
  },

  async redirectToGithub() {
    if (useMock) {
      return await this.loginOAuth('github');
    }
    const clientId = 'Ov23liP6n57fTqZ9K2E4';
    const redirectUri = window.location.origin + '/';
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=github`;
    window.location.href = githubUrl;
    return null;
  }
};
