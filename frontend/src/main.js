import { ThreeCanvas } from './components/ThreeCanvas';
import { SkillsphereCharts } from './components/Charts';
import { api } from './services/api';
import { gsap } from 'gsap';
import './style.css';

// Initialize 3D Canvas
let threeBg;
window.addEventListener('DOMContentLoaded', () => {
  threeBg = new ThreeCanvas();
  router(); // trigger initial route
});

// App State
const state = {
  user: api.getUser(),
  activeCourse: null,
  activeQuiz: null,
  quizTimer: null,
  quizTimeLeft: 10,
  quizCurrentQuestion: 0,
  quizScore: 0,
};

// Router Helper
window.addEventListener('hashchange', router);

function navigate(hash) {
  window.location.hash = hash;
}

// Global SVG Icons
const Icons = {
  book: `<svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>`,
  academic: `<svg class="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"></path></svg>`,
  chart: `<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2"></path></svg>`,
  trophy: `<svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path></svg>`,
  bell: `<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>`
};

// Router Function
async function router() {
  const hash = window.location.hash || '#landing';
  const appContainer = document.getElementById('app');
  const baseRoute = hash.split('/')[0];

  // Handle OAuth Callbacks
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const stateParam = urlParams.get('state');

  // Handle Google Hash Parameters (Implicit Flow callback)
  let googleToken = null;
  if (window.location.hash && window.location.hash.includes('access_token=')) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    googleToken = hashParams.get('access_token');
    const hashState = hashParams.get('state');
    if (googleToken && hashState === 'google') {
      window.location.hash = '';
      try {
        const user = await api.loginWithGoogleToken(googleToken);
        state.user = user;
        navigate('#student-dashboard');
        return;
      } catch (err) {
        console.error('Google OAuth failed:', err);
      }
    }
  }

  // Handle GitHub Query Parameters (Auth Code flow callback)
  if (code && stateParam === 'github') {
    window.history.replaceState({}, document.title, window.location.pathname);
    try {
      const user = await api.loginWithGithubCode(code);
      state.user = user;
      navigate('#student-dashboard');
      return;
    } catch (err) {
      console.error('GitHub OAuth failed:', err);
    }
  }

  // Clear any active quiz timers to prevent memory leaks/crashes on route navigation
  if (state.quizTimer) {
    clearInterval(state.quizTimer);
    state.quizTimer = null;
  }

  // Trigger 3D background page transition
  if (threeBg) {
    let cleanView = hash.substring(1).split('/')[0];
    threeBg.transitionToPage(cleanView);
  }

  // Retention Redirect: Logged in users cannot visit landing/auth pages unless they explicitly logout
  if (['#landing', '#login', '#register'].includes(baseRoute) && state.user) {
    if (state.user.role === 'ROLE_ADMIN') navigate('#admin-dashboard');
    else if (state.user.role === 'ROLE_TRAINER') navigate('#trainer-dashboard');
    else navigate('#student-dashboard');
    return;
  }

  // Intercept Protected Routes
  const protectedRoutes = ['#dashboard', '#student-dashboard', '#trainer-dashboard', '#admin-dashboard', '#courses', '#quiz', '#forum', '#profile', '#settings'];
  if (protectedRoutes.includes(baseRoute) && !state.user) {
    navigate('#login');
    return;
  }

  const hideHeader = ['#landing', '#login', '#register'].includes(baseRoute);

  let viewHtml = '';
  
  if (hideHeader) {
    viewHtml = await renderView(hash);
    appContainer.innerHTML = viewHtml;
  } else {
    viewHtml = `
      ${renderHeader()}
      <main id="main-content" class="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-20">
        ${await renderView(hash)}
      </main>
      ${renderFooter()}
    `;
    appContainer.innerHTML = viewHtml;
  }

  // Attach Event Listeners inside sub-views
  attachEventListeners(hash);

  // Animate Entry using GSAP
  gsap.fromTo(
    hideHeader ? '#app > div' : '#main-content',
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.35, ease: 'power1.out' }
  );

  initializeWidgets(hash);
}

// Render Navigation Header
function renderHeader() {
  const user = state.user;
  const isStudent = user?.role === 'ROLE_STUDENT';
  const isTrainer = user?.role === 'ROLE_TRAINER';
  const isAdmin = user?.role === 'ROLE_ADMIN';

  return `
    <header class="sticky top-0 z-50 w-full bg-[#11131c]/80 border-b border-[#1f2230] py-4 backdrop-blur-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <!-- Logo -->
        <a href="#landing" class="flex items-center gap-2 text-xl font-bold tracking-tight">
          <span class="p-1.5 bg-indigo-600/10 text-indigo-400 rounded border border-indigo-600/30">🪐</span>
          <span class="premium-gradient-text">SkillSphere</span>
        </a>

        <!-- Navigation Links -->
        <nav class="hidden md:flex items-center gap-6 text-sm font-medium">
          ${isStudent ? `
            <a href="#student-dashboard" class="text-gray-300 hover:text-white transition">Dashboard</a>
            <a href="#courses" class="text-gray-300 hover:text-white transition">Courses</a>
            <a href="#forum" class="text-gray-300 hover:text-white transition">Discussion Forums</a>
            <a href="#profile" class="text-gray-300 hover:text-white transition">My Credentials</a>
          ` : ''}
          ${isTrainer ? `
            <a href="#trainer-dashboard" class="text-gray-300 hover:text-white transition">Trainer Desk</a>
            <a href="#courses" class="text-gray-300 hover:text-white transition">Syllabus Index</a>
            <a href="#forum" class="text-gray-300 hover:text-white transition">Discussion Forums</a>
          ` : ''}
          ${isAdmin ? `
            <a href="#admin-dashboard" class="text-gray-300 hover:text-white transition">Command Center</a>
            <a href="#courses" class="text-gray-300 hover:text-white transition">Manage Courses</a>
            <a href="#forum" class="text-gray-300 hover:text-white transition">Discussion Forums</a>
          ` : ''}
        </nav>

        <!-- Right Controls -->
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-3 pl-4 border-l border-white/10 text-xs">
            <div class="text-right hidden sm:block">
              <p class="text-xs font-semibold text-white leading-none">${user?.name || 'User'}</p>
              <p class="text-[10px] text-gray-400 mt-1 uppercase leading-none">${user?.role?.replace('ROLE_', '')}</p>
            </div>
            
            <button id="btn-logout" class="btn-solid-secondary text-[10px] px-3.5 py-1.5 font-semibold">
              Log Out
            </button>
          </div>
        </div>
      </div>
    </header>
  `;
}

// Render Footer
function renderFooter() {
  return `
    <footer class="w-full border-t border-[#1f2230] py-4 mt-8 bg-[#0a0b10] relative z-20 text-[10px] text-gray-500">
      <div class="max-w-7xl mx-auto px-4 text-center sm:flex sm:justify-between">
        <p>&copy; 2026 SkillSphere. Minimalist Learning Platform.</p>
        <div class="flex justify-center gap-4 mt-1 sm:mt-0">
          <a href="#" class="hover:text-gray-300">Privacy Policy</a>
          <a href="#" class="hover:text-gray-300">Terms of Service</a>
        </div>
      </div>
    </footer>
  `;
}

// Router Switch Views
async function renderView(hash) {
  const parts = hash.split('/');
  const mainRoute = parts[0];

  switch (mainRoute) {
    case '#landing':
      return viewLanding();
    case '#login':
      return viewLogin();
    case '#register':
      return viewRegister();
    case '#student-dashboard':
    case '#dashboard':
      return await viewStudentDashboard();
    case '#trainer-dashboard':
      return await viewTrainerDashboard();
    case '#admin-dashboard':
      return await viewAdminDashboard();
    case '#courses':
      if (parts[1]) {
        return await viewCourseDetails(parts[1]);
      }
      return await viewCourses();
    case '#quiz':
      if (parts[1]) {
        return await viewQuiz(parts[1]);
      }
      return await viewCourses();
    case '#forum':
      return await viewForum();
    case '#profile':
      return await viewProfile();
    default:
      return viewLanding();
  }
}

// --- MINIMALIST LANDING PAGE ---
function viewLanding() {
  return `
    <div class="relative min-h-screen flex flex-col justify-between w-full py-6">
      <!-- Premium Sticky Navigation Bar -->
      <nav class="max-w-7xl w-full mx-auto px-6 flex justify-between items-center relative z-20">
        <a href="#landing" class="flex items-center gap-2 text-xl font-bold">
          <span class="p-1.5 bg-indigo-600/10 text-indigo-400 rounded border border-indigo-600/20">🪐</span>
          <span class="premium-gradient-text">SkillSphere</span>
        </a>
        <div class="hidden md:flex gap-8 text-xs text-gray-400 items-center">
          <a href="#landing" class="hover:text-white transition-colors">Home</a>
          <a href="#login" class="hover:text-white transition-colors">Courses</a>
          <a href="#login" class="hover:text-white transition-colors">Pricing</a>
          <a href="#login" class="hover:text-white transition-colors">Enterprise</a>
        </div>
        <div class="flex gap-3">
          <a href="#login" class="btn-solid-secondary text-xs px-5 py-2">Sign In</a>
          <a href="#register" class="btn-solid-primary text-xs px-6 py-2">Get Started</a>
        </div>
      </nav>

      <!-- Immersive Hero Section -->
      <section class="max-w-7xl w-full mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center flex-grow py-16 relative z-10">
        <div class="flex flex-col gap-6 text-left" id="hero-text-block">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 w-fit">
            <span>✨</span> Next-Gen Learning Management System
          </div>
          <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Learn Beyond<br/>
            <span class="text-indigo-400">Limits.</span>
          </h1>
          <p class="text-gray-400 text-sm leading-relaxed max-w-md">
            Master software engineering, creative design, and system operations inside a clean, high-performance workspace backed by verified database credentials.
          </p>
          <div class="flex flex-wrap gap-3">
            <a href="#register" class="btn-solid-primary px-8 py-3.5 text-sm font-semibold">Join Campus Portal</a>
            <a href="#login" class="btn-solid-secondary px-8 py-3.5 text-sm font-semibold">Browse Catalogue</a>
          </div>

          <!-- Solid Stats Grid -->
          <div class="grid grid-cols-4 gap-4 mt-6 border-t border-[#1f2230] pt-8 text-left">
            <div>
              <p class="text-2xl font-extrabold text-white">15K+</p>
              <p class="text-[9px] text-gray-500 uppercase font-semibold mt-0.5">Students</p>
            </div>
            <div>
              <p class="text-2xl font-extrabold text-white">120+</p>
              <p class="text-[9px] text-gray-500 uppercase font-semibold mt-0.5">Courses</p>
            </div>
            <div>
              <p class="text-2xl font-extrabold text-white">99%</p>
              <p class="text-[9px] text-gray-500 uppercase font-semibold mt-0.5">Pass Rate</p>
            </div>
            <div>
              <p class="text-2xl font-extrabold text-white">50K+</p>
              <p class="text-[9px] text-gray-500 uppercase font-semibold mt-0.5">Hours</p>
            </div>
          </div>
        </div>

        <!-- 3D Node Target Area (ThreeCanvas loads target here) -->
        <div class="h-[250px] lg:h-[400px] w-full flex items-center justify-center relative pointer-events-none"></div>
      </section>

      <!-- Featured Course Preview Catalogue -->
      <section class="max-w-7xl w-full mx-auto px-6 py-16 relative z-20 border-t border-[#1f2230]">
        <div class="text-center mb-12">
          <h2 class="text-2xl font-extrabold text-white">Featured Programs</h2>
          <p class="text-xs text-gray-400 mt-2">Acquire highly sought-after industry skills in computing, animation, and security.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Course Card 1 -->
          <div class="minimal-card rounded overflow-hidden flex flex-col group cursor-pointer" onclick="location.hash='#login'">
            <div class="relative h-40 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div class="absolute top-3 left-3 px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/20">CREATIVE CODING</div>
            </div>
            <div class="p-5 flex-grow flex flex-col justify-between gap-3">
              <div>
                <h3 class="text-xs font-bold text-white uppercase line-clamp-1">Introduction to WebGL and Three.js</h3>
                <p class="text-gray-400 text-[11px] leading-relaxed mt-2 line-clamp-2">Learn to build highly performant procedural 3D scenes, particles, and custom lighting shader designs.</p>
              </div>
              <div class="flex justify-between items-center text-[10px] text-gray-500 border-t border-gray-800/50 pt-3">
                <span>⏱️ 12 Hours</span>
                <span class="text-indigo-400 font-medium">Enroll Now →</span>
              </div>
            </div>
          </div>

          <!-- Course Card 2 -->
          <div class="minimal-card rounded overflow-hidden flex flex-col group cursor-pointer" onclick="location.hash='#login'">
            <div class="relative h-40 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&auto=format&fit=crop&q=60" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div class="absolute top-3 left-3 px-2 py-0.5 rounded text-[9px] font-bold bg-pink-500/20 text-pink-400 border border-pink-500/20">BACKEND</div>
            </div>
            <div class="p-5 flex-grow flex flex-col justify-between gap-3">
              <div>
                <h3 class="text-xs font-bold text-white uppercase line-clamp-1">Advanced Microservices with Spring Boot</h3>
                <p class="text-gray-400 text-[11px] leading-relaxed mt-2 line-clamp-2">Secure and scale enterprise grade APIs using Spring Security JWT and MySQL relational database designs.</p>
              </div>
              <div class="flex justify-between items-center text-[10px] text-gray-500 border-t border-gray-800/50 pt-3">
                <span>⏱️ 24 Hours</span>
                <span class="text-indigo-400 font-medium">Enroll Now →</span>
              </div>
            </div>
          </div>

          <!-- Course Card 3 -->
          <div class="minimal-card rounded overflow-hidden flex flex-col group cursor-pointer" onclick="location.hash='#login'">
            <div class="relative h-40 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=500&auto=format&fit=crop&q=60" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div class="absolute top-3 left-3 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">FRONTEND</div>
            </div>
            <div class="p-5 flex-grow flex flex-col justify-between gap-3">
              <div>
                <h3 class="text-xs font-bold text-white uppercase line-clamp-1">Creative Motion Design with GSAP</h3>
                <p class="text-gray-400 text-[11px] leading-relaxed mt-2 line-clamp-2">Create premium smooth entrance animations, web page transitions, and custom scroll triggers for portfolios.</p>
              </div>
              <div class="flex justify-between items-center text-[10px] text-gray-500 border-t border-gray-800/50 pt-3">
                <span>⏱️ 9 Hours</span>
                <span class="text-indigo-400 font-medium">Enroll Now →</span>
              </div>
            </div>
          </div>

          <!-- Course Card 4 -->
          <div class="minimal-card rounded overflow-hidden flex flex-col group cursor-pointer" onclick="location.hash='#login'">
            <div class="relative h-40 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500&auto=format&fit=crop&q=60" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div class="absolute top-3 left-3 px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/20">SECURITY</div>
            </div>
            <div class="p-5 flex-grow flex flex-col justify-between gap-3">
              <div>
                <h3 class="text-xs font-bold text-white uppercase line-clamp-1">Secure RESTful Architectures</h3>
                <p class="text-gray-400 text-[11px] leading-relaxed mt-2 line-clamp-2">Understand threat modeling, input validation, cross-origin resource filters, and BCrypt security tokens.</p>
              </div>
              <div class="flex justify-between items-center text-[10px] text-gray-500 border-t border-gray-800/50 pt-3">
                <span>⏱️ 15 Hours</span>
                <span class="text-indigo-400 font-medium">Enroll Now →</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Key Capabilities Section -->
      <section class="max-w-7xl w-full mx-auto px-6 py-12 relative z-20 border-t border-[#1f2230]">
        <div class="text-center mb-10">
          <h2 class="text-xl font-bold text-white">Platform Core Pillars</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="minimal-card p-6 rounded flex flex-col gap-3">
            <div class="p-2 w-fit rounded bg-indigo-500/10">${Icons.book}</div>
            <h3 class="text-sm font-bold text-white uppercase">Syllabus Outlines</h3>
            <p class="text-gray-400 text-xs leading-relaxed">
              Track course modules, download attachment files, and check off completed lesson items dynamically.
            </p>
          </div>
          <div class="minimal-card p-6 rounded flex flex-col gap-3">
            <div class="p-2 w-fit rounded bg-pink-500/10">${Icons.academic}</div>
            <h3 class="text-sm font-bold text-white uppercase">Verified Quizzes</h3>
            <p class="text-gray-400 text-xs leading-relaxed">
              Complete evaluations under simple countdown parameters and record performance parameters.
            </p>
          </div>
          <div class="minimal-card p-6 rounded flex flex-col gap-3">
            <div class="p-2 w-fit rounded bg-emerald-500/10">${Icons.chart}</div>
            <h3 class="text-sm font-bold text-white uppercase">SaaS Security</h3>
            <p class="text-gray-400 text-xs leading-relaxed">
              Protected authentication routines backed by stateless token validation filters.
            </p>
          </div>
        </div>
      </section>

      <!-- Student Testimonials Section -->
      <section class="max-w-7xl w-full mx-auto px-6 py-16 relative z-20 border-t border-[#1f2230]">
        <div class="text-center mb-12">
          <h2 class="text-2xl font-extrabold text-white">Loved by Creators & Developers</h2>
          <p class="text-xs text-gray-400 mt-2">See how SkillSphere shifts careers and enhances engineering workflows globally.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="minimal-card p-6 rounded flex flex-col justify-between gap-4">
            <p class="text-gray-300 text-xs italic leading-relaxed">"The 3D interactive learning workspace here is amazing. Being able to enroll, submit zip files of Three.js projects, and receive actual reviews feels extremely realistic."</p>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">LS</div>
              <div>
                <h4 class="text-xs font-bold text-white">Liam Sterling</h4>
                <p class="text-[9px] text-gray-500">Frontend Engineer at Vercel</p>
              </div>
            </div>
          </div>
          <div class="minimal-card p-6 rounded flex flex-col justify-between gap-4">
            <p class="text-gray-300 text-xs italic leading-relaxed">"I verified the security mechanisms—JWT token validation, BCrypt password encoders, and REST APIs are designed properly. Excellent backend learning experience."</p>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">MK</div>
              <div>
                <h4 class="text-xs font-bold text-white">Meera Kapoor</h4>
                <p class="text-[9px] text-gray-500">Security Analyst at CrowdStrike</p>
              </div>
            </div>
          </div>
          <div class="minimal-card p-6 rounded flex flex-col justify-between gap-4">
            <p class="text-gray-300 text-xs italic leading-relaxed">"Getting a real, downloadable PDF certificate generated on the fly via iText/OpenPDF when passing trainer grading is incredibly satisfying."</p>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-xs font-bold text-white">DH</div>
              <div>
                <h4 class="text-xs font-bold text-white">David Hoffman</h4>
                <p class="text-[9px] text-gray-500">Self-taught Developer</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Interactive FAQ Accordions -->
      <section class="max-w-3xl w-full mx-auto px-6 py-16 relative z-20 border-t border-[#1f2230]">
        <div class="text-center mb-10">
          <h2 class="text-2xl font-extrabold text-white">Frequently Asked Questions</h2>
          <p class="text-xs text-gray-400 mt-2">Have questions about the SkillSphere platform? We have answers.</p>
        </div>
        <div class="flex flex-col gap-4">
          <!-- FAQ 1 -->
          <div class="faq-item minimal-card p-4 rounded flex flex-col gap-2 transition-all">
            <button class="faq-accordion-header w-full flex justify-between items-center text-left text-xs font-bold text-white">
              <span>Do I get a verified completion certificate?</span>
              <span class="faq-icon text-[10px] text-indigo-400 transition-transform duration-200">▼</span>
            </button>
            <div class="faq-body hidden text-gray-400 text-xs leading-relaxed mt-2 border-t border-gray-800/50 pt-2">
              Yes! Upon completing the course evaluations and passing the trainer's grading review, a cryptographically signed certificate is automatically generated in your My Credentials portal. You can download this directly as a PDF.
            </div>
          </div>

          <!-- FAQ 2 -->
          <div class="faq-item minimal-card p-4 rounded flex flex-col gap-2 transition-all">
            <button class="faq-accordion-header w-full flex justify-between items-center text-left text-xs font-bold text-white">
              <span>Is the training platform mobile friendly?</span>
              <span class="faq-icon text-[10px] text-indigo-400 transition-transform duration-200">▼</span>
            </button>
            <div class="faq-body hidden text-gray-400 text-xs leading-relaxed mt-2 border-t border-gray-800/50 pt-2">
              Absolutely. The entire workspace is responsive, leveraging glassmorphism interfaces, interactive components, and fluid layouts optimized for all screen and device sizes.
            </div>
          </div>

          <!-- FAQ 3 -->
          <div class="faq-item minimal-card p-4 rounded flex flex-col gap-2 transition-all">
            <button class="faq-accordion-header w-full flex justify-between items-center text-left text-xs font-bold text-white">
              <span>Are there hands-on projects?</span>
              <span class="faq-icon text-[10px] text-indigo-400 transition-transform duration-200">▼</span>
            </button>
            <div class="faq-body hidden text-gray-400 text-xs leading-relaxed mt-2 border-t border-gray-800/50 pt-2">
              Every course module features hands-on assignments. You upload your project archive directly on the course page, which registers a record in our live MySQL backend. A trainer then reviews and grades your work.
            </div>
          </div>
        </div>
      </section>

      <!-- Premium Detailed Footer -->
      <footer class="max-w-7xl w-full mx-auto px-6 pt-12 pb-6 border-t border-[#1f2230] relative z-20 text-xs text-gray-500">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left">
          <div class="flex flex-col gap-3">
            <a href="#landing" class="flex items-center gap-2 text-sm font-bold text-white">
              <span class="p-1 bg-indigo-600/10 text-indigo-400 rounded border border-indigo-600/20">🪐</span>
              <span class="premium-gradient-text">SkillSphere</span>
            </a>
            <p class="text-[11px] leading-relaxed">Pioneering interactive learning mechanisms. Educating engineering teams and creative creators beyond parameters.</p>
          </div>
          <div class="flex flex-col gap-2">
            <h4 class="text-white font-bold text-[11px] uppercase tracking-wide mb-1">Academics</h4>
            <a href="#login" class="hover:text-indigo-400 transition-colors">Featured Tracks</a>
            <a href="#login" class="hover:text-indigo-400 transition-colors">Grading Standards</a>
            <a href="#login" class="hover:text-indigo-400 transition-colors">Interactive Sandbox</a>
          </div>
          <div class="flex flex-col gap-2">
            <h4 class="text-white font-bold text-[11px] uppercase tracking-wide mb-1">Company</h4>
            <a href="#landing" class="hover:text-indigo-400 transition-colors">About Campus</a>
            <a href="#landing" class="hover:text-indigo-400 transition-colors">Platform Status</a>
            <a href="#landing" class="hover:text-indigo-400 transition-colors">Trust Operations</a>
          </div>
          <div class="flex flex-col gap-2">
            <h4 class="text-white font-bold text-[11px] uppercase tracking-wide mb-1">System Support</h4>
            <a href="#landing" class="hover:text-indigo-400 transition-colors">Documentation</a>
            <a href="#landing" class="hover:text-indigo-400 transition-colors">Security Disclosures</a>
            <a href="#landing" class="hover:text-indigo-400 transition-colors">Help Desk</a>
          </div>
        </div>
        <div class="flex flex-col md:flex-row justify-between items-center border-t border-gray-800/30 pt-6 text-[10px]">
          <p>© 2026 SkillSphere, Inc. All rights reserved on the blockchain.</p>
          <div class="flex gap-4 mt-2 md:mt-0">
            <a href="#landing" class="hover:underline">Terms of Service</a>
            <a href="#landing" class="hover:underline">Privacy Policy</a>
            <a href="#landing" class="hover:underline">Cookies Parameters</a>
          </div>
        </div>
      </footer>
    </div>
  `;
}

// --- MINIMALIST AUTH PAGES ---
function viewLogin() {
  return `
    <div class="min-h-screen w-full flex items-center justify-center relative py-12 px-4">
      <div class="absolute top-6 left-6 z-20">
        <a href="#landing" class="flex items-center gap-2 text-lg font-bold">
          <span class="p-1.5 bg-indigo-600/10 text-indigo-400 rounded border border-indigo-600/20">🪐</span>
          <span class="premium-gradient-text">SkillSphere</span>
        </a>
      </div>

      <div class="minimal-card max-w-sm w-full p-8 rounded-lg relative z-10 flex flex-col gap-6" id="auth-card">
        <div class="text-center">
          <h2 class="text-2xl font-bold text-white">Sign In</h2>
          <p class="text-xs text-gray-500 mt-1">Enter credentials to log in to your account.</p>
        </div>

        <div id="auth-error-msg" class="hidden bg-red-500/10 text-red-400 text-xs p-3 rounded border border-red-500/20"></div>

        <form id="form-login" class="flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-400 font-medium">Email Address</label>
            <input type="email" id="login-email" class="input-minimal p-2.5 text-xs" placeholder="you@domain.com" required />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-400 font-medium">Password</label>
            <input type="password" id="login-password" class="input-minimal p-2.5 text-xs" placeholder="••••••••" required />
          </div>

          <div class="flex justify-between items-center text-xs">
            <label class="flex items-center gap-2 text-gray-500 cursor-pointer">
              <input type="checkbox" checked class="rounded border-gray-700 bg-[#151722] text-indigo-600"> Remember Me
            </label>
            <a href="#" class="text-indigo-400 hover:underline">Forgot Password?</a>
          </div>

          <button type="submit" class="btn-solid-primary w-full py-3 rounded text-xs font-semibold">
            Log In
          </button>
        </form>

        <div class="relative flex py-1 items-center">
          <div class="flex-grow border-t border-gray-800"></div>
          <span class="flex-shrink mx-3 text-[9px] text-gray-500 uppercase tracking-wider">Or continue with</span>
          <div class="flex-grow border-t border-gray-800"></div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button type="button" id="btn-oauth-google" class="btn-solid-secondary py-2.5 px-3 text-[10px] font-semibold flex items-center justify-center gap-2">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google
          </button>
          <button type="button" id="btn-oauth-github" class="btn-solid-secondary py-2.5 px-3 text-[10px] font-semibold flex items-center justify-center gap-2">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
            GitHub
          </button>
        </div>

        <div class="text-center text-xs text-gray-500">
          First time? <a href="#register" class="text-indigo-400 font-semibold hover:underline">Sign Up</a>
        </div>
      </div>
    </div>
  `;
}

function viewRegister() {
  return `
    <div class="min-h-screen w-full flex items-center justify-center relative py-12 px-4">
      <div class="absolute top-6 left-6 z-20">
        <a href="#landing" class="flex items-center gap-2 text-lg font-bold">
          <span class="p-1.5 bg-indigo-600/10 text-indigo-400 rounded border border-indigo-600/20">🪐</span>
          <span class="premium-gradient-text">SkillSphere</span>
        </a>
      </div>

      <div class="minimal-card max-w-sm w-full p-8 rounded-lg relative z-10 flex flex-col gap-6" id="auth-card">
        <div class="text-center">
          <h2 class="text-2xl font-bold text-white">Create Account</h2>
          <p class="text-xs text-gray-500 mt-1">Configure your personal profile details.</p>
        </div>

        <div id="auth-success-msg" class="hidden bg-emerald-500/10 text-emerald-400 text-xs p-3 rounded border border-emerald-500/20"></div>

        <form id="form-register" class="flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-400 font-medium">Username</label>
            <input type="text" id="reg-name" class="input-minimal p-2.5 text-xs" placeholder="Alex Mercer" required />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-400 font-medium">Email Address</label>
            <input type="email" id="reg-email" class="input-minimal p-2.5 text-xs" placeholder="you@domain.com" required />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-400 font-medium">Account Type</label>
            <select id="reg-role" class="input-minimal p-2.5 text-xs bg-[#151722] cursor-pointer">
              <option value="ROLE_STUDENT">Student (Enroll & submit assignments)</option>
              <option value="ROLE_TRAINER">Trainer (Grade submissions & create courses)</option>
              <option value="ROLE_ADMIN">Administrator (Manage users & roles)</option>
            </select>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-400 font-medium">Password</label>
            <input type="password" id="reg-password" class="input-minimal p-2.5 text-xs" placeholder="••••••••" required />
          </div>

          <button type="submit" class="btn-solid-primary w-full py-3 rounded text-xs font-semibold">
            Create Profile
          </button>
        </form>

        <div class="relative flex py-1 items-center">
          <div class="flex-grow border-t border-gray-800"></div>
          <span class="flex-shrink mx-3 text-[9px] text-gray-500 uppercase tracking-wider">Or continue with</span>
          <div class="flex-grow border-t border-gray-800"></div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button type="button" id="btn-oauth-register-google" class="btn-solid-secondary py-2.5 px-3 text-[10px] font-semibold flex items-center justify-center gap-2">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google
          </button>
          <button type="button" id="btn-oauth-register-github" class="btn-solid-secondary py-2.5 px-3 text-[10px] font-semibold flex items-center justify-center gap-2">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
            GitHub
          </button>
        </div>

        <div class="text-center text-xs text-gray-500">
          Already verified? <a href="#login" class="text-indigo-400 font-semibold hover:underline">Log In</a>
        </div>
      </div>
    </div>
  `;
}

// --- MINIMALIST STUDENT DASHBOARD ---
async function viewStudentDashboard() {
  let courses = [];
  let certificates = [];
  let studentSubmissions = [];
  try {
    courses = await api.getCourses();
    if (state.user && state.user.id) {
      certificates = await api.getStudentCertificates(state.user.id);
      studentSubmissions = await api.getStudentSubmissions(state.user.id);
    }
  } catch (err) {
    console.error('Failed to load student data:', err);
  }

  // Calculate progress metrics
  courses = courses.map(course => {
    const sub = studentSubmissions.find(s => s.course && s.course.id === course.id);
    let progress = 0;
    if (sub) {
      if (sub.grade && sub.grade !== 'Pending') {
        progress = 100;
      } else {
        progress = 50;
      }
    }
    return { ...course, progress };
  });

  const enrolledCount = courses.length;
  const certificateCount = certificates.length;

  const gradedSubmissions = studentSubmissions.filter(s => s.grade && s.grade !== 'Pending');
  let averageScore = '88%';
  if (gradedSubmissions.length > 0) {
    const scores = gradedSubmissions.map(s => {
      const g = s.grade.toUpperCase().trim();
      if (g.startsWith('A')) return 95;
      if (g.startsWith('B')) return 85;
      if (g.startsWith('C')) return 75;
      if (g.startsWith('D')) return 65;
      return 100;
    });
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    averageScore = `${avg}%`;
  }

  return `
    <div class="flex flex-col gap-8">
      <!-- Headline -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-white">Student Dashboard</h1>
          <p class="text-xs text-gray-500 mt-1">Review active courses, weekly statistics, and deadlines.</p>
        </div>
        <div>
          <a href="#courses" class="btn-solid-primary text-xs px-5 py-2.5 rounded flex items-center gap-2">
            <span>🛒</span> Course Directory
          </a>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="minimal-card p-5 rounded flex items-center gap-4">
          <div class="p-2.5 rounded bg-indigo-500/10">${Icons.book}</div>
          <div>
            <p class="text-lg font-bold text-white">${enrolledCount}</p>
            <p class="text-[10px] text-gray-500 uppercase mt-0.5">Enrolled</p>
          </div>
        </div>
        <div class="minimal-card p-5 rounded flex items-center gap-4">
          <div class="p-2.5 rounded bg-pink-500/10">${Icons.chart}</div>
          <div>
            <p class="text-lg font-bold text-white">18.5 Hrs</p>
            <p class="text-[10px] text-gray-500 uppercase mt-0.5">Study Time</p>
          </div>
        </div>
        <div class="minimal-card p-5 rounded flex items-center gap-4">
          <div class="p-2.5 rounded bg-amber-500/10">${Icons.trophy}</div>
          <div>
            <p class="text-lg font-bold text-white">${averageScore}</p>
            <p class="text-[10px] text-gray-500 uppercase mt-0.5">Avg Score</p>
          </div>
        </div>
        <div class="minimal-card p-5 rounded flex items-center gap-4">
          <div class="p-2.5 rounded bg-indigo-500/10">${Icons.book}</div>
          <div>
            <p class="text-lg font-bold text-white">${certificateCount}</p>
            <p class="text-[10px] text-gray-500 uppercase mt-0.5">Certificates</p>
          </div>
        </div>
      </div>

      <!-- Main Visual Deck -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Analytics & Progress Chart -->
        <div class="lg:col-span-2 minimal-card p-6 rounded flex flex-col gap-4">
          <div class="flex justify-between items-center">
            <h3 class="text-xs font-bold uppercase tracking-wider text-gray-400">Weekly Activity Logs</h3>
            <span class="badge-solid badge-cyan">Active</span>
          </div>
          <div class="h-64 w-full relative">
            <canvas id="student-activity-chart"></canvas>
          </div>
        </div>

        <!-- Deadlines / Today's Tasks -->
        <div class="minimal-card p-6 rounded flex flex-col gap-4">
          <h3 class="text-xs font-bold uppercase tracking-wider text-gray-400">Course Deadlines</h3>
          <div class="flex flex-col gap-3 text-xs">
            <div class="p-3.5 rounded bg-[#151722] border border-[#232737] flex flex-col gap-1">
              <div class="flex justify-between items-center text-[10px] font-bold text-pink-400">
                <span>ASSIGNMENT</span>
                <span>URGENT</span>
              </div>
              <p class="text-xs font-semibold text-white mt-1">WebGL Shader Project</p>
              <p class="text-[10px] text-gray-500">Zip package evaluation submission.</p>
            </div>
            <div class="p-3.5 rounded bg-[#151722] border border-[#232737] flex flex-col gap-1">
              <div class="flex justify-between items-center text-[10px] font-bold text-indigo-400">
                <span>CHALLENGE</span>
                <span>3 DAYS</span>
              </div>
              <p class="text-xs font-semibold text-white mt-1">Spring Boot Filters</p>
              <p class="text-[10px] text-gray-500">Complete mid-term question block.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Enrolled Classes List -->
      <div class="flex flex-col gap-4">
        <h3 class="text-base font-bold text-white uppercase tracking-wide">My Active Courses</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${courses.length === 0 ? `<p class="text-xs text-gray-500">You are not enrolled in any courses.</p>` : ''}
          ${courses.map(course => `
            <div class="minimal-card p-5 rounded flex flex-col sm:flex-row gap-4 items-center">
              <img src="${course.thumbnail}" class="w-full sm:w-24 h-24 object-cover rounded border border-white/5" />
              <div class="flex-grow flex flex-col gap-2 w-full text-xs">
                <div class="flex justify-between items-center">
                  <span class="badge-solid badge-cyan">${course.difficulty.toUpperCase()}</span>
                  <span class="text-gray-500 text-[10px]">${course.duration} MINS</span>
                </div>
                <h4 class="text-xs font-bold text-white line-clamp-1">${course.title}</h4>
                <p class="text-[10px] text-gray-500">Instructor: ${typeof course.instructor === 'object' && course.instructor ? course.instructor.fullName : (course.instructor || 'Trainer')}</p>
                
                <!-- Progress Bar -->
                <div class="flex items-center gap-3 mt-1">
                  <div class="flex-grow bg-[#151722] rounded h-1.5 overflow-hidden border border-[#232737]">
                    <div class="bg-indigo-500 h-full" style="width: ${course.progress}%"></div>
                  </div>
                  <span class="text-[10px] text-indigo-400 font-bold">${course.progress}%</span>
                </div>

                <div class="flex justify-end mt-2">
                  <a href="#courses/${course.id}" class="btn-solid-primary text-[10px] px-3.5 py-1.5 rounded">Resume</a>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// --- MINIMALIST TRAINER DASHBOARD ---
async function viewTrainerDashboard() {
  let courses = [];
  let submissions = [];
  try {
    courses = await api.getCourses();
    submissions = await api.getSubmissions();
  } catch (err) {
    console.error('Failed to load trainer data:', err);
  }

  const pendingSubmissions = submissions.filter(s => s.status === 'Submitted' || s.grade === 'Pending');
  const gradedCount = submissions.length - pendingSubmissions.length;
  const uniqueStudents = new Set(submissions.map(s => s.student ? s.student.email : null).filter(Boolean));

  return `
    <div class="flex flex-col gap-8">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-white">Trainer Dashboard</h1>
          <p class="text-xs text-gray-500 mt-1">Create syllabus outlines and grade student evaluator packages.</p>
        </div>
      </div>

      <!-- Quick Metrics -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="minimal-card p-5 rounded flex items-center gap-4">
          <div class="p-2.5 rounded bg-indigo-500/10">${Icons.book}</div>
          <div>
            <p class="text-lg font-bold text-white">${courses.length}</p>
            <p class="text-[10px] text-gray-500 uppercase">Courses</p>
          </div>
        </div>
        <div class="minimal-card p-5 rounded flex items-center gap-4">
          <div class="p-2.5 rounded bg-pink-500/10">${Icons.academic}</div>
          <div>
            <p class="text-lg font-bold text-white">${uniqueStudents.size || 3}</p>
            <p class="text-[10px] text-gray-500 uppercase">Students</p>
          </div>
        </div>
        <div class="minimal-card p-5 rounded flex items-center gap-4">
          <div class="p-2.5 rounded bg-emerald-500/10">${Icons.chart}</div>
          <div>
            <p class="text-lg font-bold text-white">${gradedCount}</p>
            <p class="text-[10px] text-gray-500 uppercase">Graded</p>
          </div>
        </div>
        <div class="minimal-card p-5 rounded flex items-center gap-4">
          <div class="p-2.5 rounded bg-amber-500/10">${Icons.bell}</div>
          <div>
            <p class="text-lg font-bold text-white">${pendingSubmissions.length}</p>
            <p class="text-[10px] text-gray-500 uppercase">Pending</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Launch Course Form -->
        <div class="minimal-card p-6 rounded flex flex-col gap-4">
          <h3 class="text-xs font-bold uppercase tracking-wider text-gray-400">Launch New Course</h3>
          
          <div id="trainer-success-msg" class="hidden bg-emerald-500/10 text-emerald-400 text-xs p-3 rounded border border-emerald-500/20"></div>

          <form id="form-create-course" class="flex flex-col gap-3 text-xs">
            <div class="flex flex-col gap-1">
              <label class="text-gray-400">Course Title</label>
              <input type="text" id="course-title" class="input-minimal p-2.5 text-xs" placeholder="e.g. Creative Motion Design" required/>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-gray-400">Category Tag</label>
              <input type="text" id="course-category" class="input-minimal p-2.5 text-xs" placeholder="Frontend Engineering" required/>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1">
                <label class="text-gray-400">Difficulty</label>
                <select id="course-difficulty" class="input-minimal p-2.5 text-xs bg-[#151722] cursor-pointer">
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-gray-400">Duration (Mins)</label>
                <input type="number" id="course-duration" class="input-minimal p-2.5 text-xs" placeholder="180" required/>
              </div>
            </div>
            <button type="submit" class="btn-solid-primary w-full py-3 mt-2 text-xs font-semibold">
              Publish Course
            </button>
          </form>
        </div>

        <!-- Grader Console -->
        <div class="lg:col-span-2 minimal-card p-6 rounded flex flex-col gap-4">
          <h3 class="text-xs font-bold uppercase tracking-wider text-gray-400">Student Assignment Queue</h3>
          <div class="flex flex-col gap-3 overflow-y-auto max-h-[350px]">
            ${submissions.length === 0 ? `<p class="text-xs text-gray-500">No student assignment items queued.</p>` : ''}
            ${submissions.map(sub => {
              // Support both flat mock format and nested API format
              const studentName = sub.student ? sub.student.fullName : (sub.studentName || 'Unknown Student');
              const courseTitle = sub.course ? sub.course.title : (sub.courseTitle || 'Unknown Course');
              const isSubmitted = sub.status === 'Submitted' || sub.grade === 'Pending';
              return `
                <div class="p-4 rounded bg-[#151722] border border-[#232737] flex flex-col gap-3 text-xs">
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="text-xs font-bold text-white">${studentName}</p>
                      <p class="text-[10px] text-gray-500 mt-0.5">Syllabus Node: ${courseTitle}</p>
                    </div>
                    <span class="badge-solid ${isSubmitted ? 'badge-pink' : 'badge-green'}">${sub.status}</span>
                  </div>
                  <div class="flex justify-between items-center text-[10px] text-indigo-400 bg-white/5 p-2 rounded">
                    <span>File: ${sub.submissionFile}</span>
                    <span class="text-gray-500 font-mono">ID: ${sub.id}</span>
                  </div>

                  ${isSubmitted ? `
                    <div class="flex gap-2 items-center" id="grade-panel-${sub.id}">
                      <input type="text" placeholder="Grade (A/B/C)" id="input-grade-${sub.id}" class="input-minimal px-2.5 py-1.5 text-xs w-20"/>
                      <input type="text" placeholder="Comments..." id="input-feedback-${sub.id}" class="input-minimal px-2.5 py-1.5 text-xs flex-grow"/>
                      <button class="btn-solid-primary text-[10px] px-3.5 py-1.5 font-bold btn-grade-submit" data-id="${sub.id}">Grade</button>
                    </div>
                  ` : `
                    <p class="text-[10px] text-gray-500">Graded: <strong class="text-emerald-400">${sub.grade}</strong> &bull; Comments: "${sub.feedback}"</p>
                  `}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// --- MINIMALIST ADMIN DASHBOARD ---
async function viewAdminDashboard() {
  let users = [];
  try {
    users = await api.getAdminUsers();
  } catch (err) {
    console.error('Failed to load admin users:', err);
  }

  const studentCount = users.filter(u => u.role === 'ROLE_STUDENT').length;
  const trainerCount = users.filter(u => u.role === 'ROLE_TRAINER').length;

  return `
    <div class="flex flex-col gap-8">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-white">System Command Center</h1>
          <p class="text-xs text-gray-500 mt-1">Review system metrics, query latencies, and modify user account roles.</p>
        </div>
      </div>

      <!-- Admin metrics grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div class="minimal-card p-5 rounded flex items-center gap-4">
          <div class="p-2.5 rounded bg-indigo-500/10">${Icons.bell}</div>
          <div>
            <p class="text-lg font-bold text-white">99.98%</p>
            <p class="text-[10px] text-gray-500 uppercase mt-0.5">Uptime</p>
          </div>
        </div>
        <div class="minimal-card p-5 rounded flex items-center gap-4">
          <div class="p-2.5 rounded bg-pink-500/10">${Icons.academic}</div>
          <div>
            <p class="text-lg font-bold text-white">Active</p>
            <p class="text-[10px] text-gray-500 uppercase mt-0.5">JWT Crypto</p>
          </div>
        </div>
        <div class="minimal-card p-5 rounded flex items-center gap-4">
          <div class="p-2.5 rounded bg-emerald-500/10">${Icons.chart}</div>
          <div>
            <p class="text-lg font-bold text-white">${users.length}</p>
            <p class="text-[10px] text-gray-500 uppercase mt-0.5">Total Users</p>
          </div>
        </div>
        <div class="minimal-card p-5 rounded flex items-center gap-4">
          <div class="p-2.5 rounded bg-amber-500/10">${Icons.trophy}</div>
          <div>
            <p class="text-lg font-bold text-white">2.1 ms</p>
            <p class="text-[10px] text-gray-500 uppercase mt-0.5">Query Latency</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- User Roles Panel -->
        <div class="lg:col-span-2 minimal-card p-6 rounded flex flex-col gap-4">
          <h3 class="text-xs font-bold uppercase tracking-wider text-gray-400">User Identity Registry</h3>
          <div class="overflow-x-auto w-full">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-[#1f2230] text-gray-500">
                  <th class="py-2.5">User</th>
                  <th class="py-2.5">Email Endpoint</th>
                  <th class="py-2.5">Authority Role</th>
                  <th class="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${users.map(u => `
                  <tr class="border-b border-[#1f2230]">
                    <td class="py-3 font-semibold text-white">${u.fullName}</td>
                    <td class="py-3 text-gray-400">${u.email}</td>
                    <td class="py-3 ${u.role === 'ROLE_ADMIN' ? 'text-amber-400' : u.role === 'ROLE_TRAINER' ? 'text-pink-400' : 'text-indigo-400'} font-medium">${u.role}</td>
                    <td class="py-3 text-right">
                      ${u.role === 'ROLE_STUDENT' ? `
                        <button class="btn-solid-primary text-[9px] px-2.5 py-1 btn-change-role" data-id="${u.id}" data-role="ROLE_TRAINER">Promote to Trainer</button>
                      ` : u.role === 'ROLE_TRAINER' ? `
                        <button class="btn-solid-secondary text-[9px] px-2.5 py-1 btn-change-role" data-id="${u.id}" data-role="ROLE_STUDENT">Demote to Student</button>
                      ` : `<span class="text-gray-600 text-[9px] italic">Admin Root</span>`}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Audit Log -->
        <div class="minimal-card p-6 rounded flex flex-col gap-4">
          <h3 class="text-xs font-bold uppercase tracking-wider text-gray-400">Security Audit Trail</h3>
          <div class="flex flex-col gap-3 font-mono text-[9px] text-gray-500 max-h-[300px] overflow-y-auto">
            <p><span>[Active]</span> Loaded ${studentCount} students and ${trainerCount} trainers.</p>
            <p><span>[Database]</span> Query metrics compiled successfully.</p>
            <p><span>[Uptime]</span> Session registers synced.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// --- MINIMALIST COURSES CATALOG ---
async function viewCourses() {
  let courses = [];
  try {
    courses = await api.getCourses();
  } catch (err) {
    console.error('Failed to load courses:', err);
  }

  return `
    <div class="flex flex-col gap-8">
      <!-- Search & Filters -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#11131c] p-4 rounded border border-[#1f2230] text-xs">
        <div class="relative w-full md:w-80">
          <input type="text" id="input-search-courses" class="input-minimal p-2.5 text-xs pl-8 w-full" placeholder="Search catalog index..."/>
          <span class="absolute left-2.5 top-3 text-gray-500 text-xs">🔍</span>
        </div>
        <div class="flex flex-wrap gap-2 w-full md:w-auto text-[9px]">
          <button class="btn-solid-primary px-4 py-1.5 category-filter-btn" data-category="all">All Courses</button>
          <button class="btn-solid-secondary px-4 py-1.5 category-filter-btn" data-category="Creative Coding">Creative Coding</button>
          <button class="btn-solid-secondary px-4 py-1.5 category-filter-btn" data-category="Backend Development">Backend Development</button>
          <button class="btn-solid-secondary px-4 py-1.5 category-filter-btn" data-category="Frontend Engineering">Frontend Engineering</button>
        </div>
      </div>

      <!-- Course Cards Catalog Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6" id="courses-catalog-grid">
        ${courses.map(course => `
          <div class="minimal-card rounded overflow-hidden flex flex-col h-full border border-white/5" data-category="${course.category}">
            <div class="relative">
              <img src="${course.thumbnail}" class="w-full h-40 object-cover border-b border-[#1f2230]" />
              <span class="absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded bg-dark-bg/95 text-indigo-400 border border-indigo-600/30">${course.difficulty.toUpperCase()}</span>
            </div>
            <div class="p-5 flex flex-col justify-between flex-grow gap-4 text-xs">
              <div class="flex flex-col gap-2">
                <span class="text-[9px] uppercase font-bold text-gray-400 tracking-wider">${course.category}</span>
                <h3 class="text-sm font-bold text-white line-clamp-2">${course.title}</h3>
                <p class="text-gray-500">Instructor: ${typeof course.instructor === 'object' && course.instructor ? course.instructor.fullName : (course.instructor || 'Trainer')}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs text-amber-400 font-bold">★ ${course.rating}</span>
                  <span class="text-[10px] text-gray-500">(${course.students} enrolled)</span>
                </div>
              </div>

              <div class="flex justify-between items-center border-t border-[#1f2230] pt-4">
                <span class="text-xs text-gray-500">${course.duration} Mins</span>
                <a href="#courses/${course.id}" class="btn-solid-primary text-[10px] px-4 py-2 rounded">
                  Open Course
                </a>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// --- MINIMALIST COURSE DETAILS ---
async function viewCourseDetails(id) {
  let courses = [];
  let studentSubmissions = [];
  try {
    courses = await api.getCourses();
    if (state.user && state.user.id) {
      studentSubmissions = await api.getStudentSubmissions(state.user.id);
    }
  } catch (err) {
    console.error('Failed to load course details:', err);
  }
  const course = courses.find(c => String(c.id) === String(id));

  if (!course) return `<div class="p-8 text-center text-gray-500">COURSE DATA NOT FOUND.</div>`;

  // Find if there is a graded/submitted assignment (support both mock and API formats)
  const sub = studentSubmissions.find(s => {
    const subCourseId = s.course ? s.course.id : s.courseId;
    return String(subCourseId) === String(course.id);
  });
  let progress = 0;
  if (sub) {
    if (sub.grade && sub.grade !== 'Pending') {
      progress = 100;
    } else {
      progress = 50;
    }
  }

  return `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Syllabus Modules navigation -->
      <div class="minimal-card p-6 rounded flex flex-col gap-4 self-start text-xs">
        <a href="#courses" class="text-indigo-400 hover:underline flex items-center gap-1">← Back to Catalog</a>
        <h3 class="text-sm font-bold text-white mt-2">${course.title}</h3>
        <p class="text-xs text-gray-500">Instructor: ${typeof course.instructor === 'object' && course.instructor ? course.instructor.fullName : (course.instructor || 'Trainer')}</p>
        
        <!-- Modules -->
        <div class="flex flex-col gap-2 mt-2">
          <div class="p-3.5 rounded bg-indigo-500/15 text-indigo-300 font-bold text-xs border border-indigo-500/20 cursor-pointer flex justify-between items-center">
            <span>Module 1: Foundations</span>
            <span class="badge-solid badge-cyan">Active</span>
          </div>
          <div class="p-3.5 rounded bg-[#151722] text-gray-400 text-xs border border-[#232737] hover:border-indigo-500/20 cursor-pointer transition">
            Module 2: Advanced Logic
          </div>
          <div class="p-3.5 rounded bg-[#151722] text-gray-400 text-xs border border-[#232737] hover:border-indigo-500/20 cursor-pointer transition">
            Module 3: Project Deployment
          </div>
        </div>

        <div class="border-t border-[#1f2230] pt-4 flex flex-col gap-2">
          <p class="text-xs font-bold text-white uppercase">Resources</p>
          <a href="#" class="text-[10px] text-gray-500 hover:text-white transition flex items-center gap-2">
            📂 syllabus_outline.pdf
          </a>
          <a href="#" class="text-[10px] text-gray-500 hover:text-white transition flex items-center gap-2">
            📂 source_code_starter.zip
          </a>
        </div>
      </div>

      <!-- Main Video player and Assignment submission -->
      <div class="lg:col-span-2 flex flex-col gap-6">
        <!-- Video Player -->
        <div class="relative w-full aspect-video rounded overflow-hidden border border-[#1f2230] flex items-center justify-center bg-black">
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6 z-10 text-xs">
            <span class="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Active Lesson</span>
            <h4 class="text-sm font-bold text-white mt-1">1.1 Project Scaffolding & Canvas Configurations</h4>
          </div>
          <div class="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 cursor-pointer flex items-center justify-center text-white text-xl z-10 transition">
            ▶
          </div>
        </div>

        <!-- Action Panel -->
        <div class="minimal-card p-6 rounded flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <div class="flex items-center gap-4">
            <div class="w-11 h-11 rounded-full border border-indigo-500/35 flex items-center justify-center font-bold text-xs text-indigo-400">
              ${progress}%
            </div>
            <div>
              <p class="text-xs font-bold text-white uppercase">Your Progression</p>
              <p class="text-[10px] text-gray-500">Unlocks certificate at 100%.</p>
            </div>
          </div>
          <div>
            <a href="#quiz/${course.id}" class="btn-solid-primary text-xs px-5 py-2.5 rounded flex items-center gap-1.5">
              <span>📝</span> Start Diagnostic Exam
            </a>
          </div>
        </div>

        <!-- Submit Assignment Form -->
        <div class="minimal-card p-6 rounded flex flex-col gap-4">
          <h3 class="text-xs font-bold uppercase tracking-wider text-gray-400">Upload Project Submission</h3>
          
          <div id="assignment-success-msg" class="hidden bg-emerald-500/10 text-emerald-400 text-[10px] p-3 rounded border border-emerald-500/20"></div>

          ${sub ? `
            <div class="p-4 rounded bg-[#151722] border border-[#232737] flex flex-col gap-2">
              <div class="flex justify-between items-center">
                <span class="font-bold text-white">Status: ${sub.status}</span>
                <span class="badge-solid ${sub.grade === 'Pending' ? 'badge-pink' : 'badge-green'}">Grade: ${sub.grade}</span>
              </div>
              <p class="text-gray-400 mt-1">Feedback: "${sub.feedback}"</p>
              <p class="text-[10px] text-gray-500 mt-2">Submitted file: ${sub.submissionFile}</p>
            </div>
          ` : `
            <form id="form-submit-assignment" class="flex flex-col gap-3 text-xs">
              <div class="flex flex-col gap-1">
                <label class="text-[9px] text-gray-500">Zip / Source Package (ZIP, MAX 5MB)</label>
                <input type="file" id="assignment-file" class="input-minimal p-2 text-xs bg-[#151722] cursor-pointer" required/>
              </div>
              <button type="submit" class="btn-solid-primary w-full py-3 rounded text-xs font-semibold">
                Upload Assignment
              </button>
            </form>
          `}
        </div>
      </div>
    </div>
  `;
}

// --- MINIMALIST QUIZ VIEW ---
async function viewQuiz(id) {
  let courses = [];
  try {
    courses = await api.getCourses();
  } catch (err) {
    console.error(err);
  }
  const course = courses.find(c => String(c.id) === String(id));

  // Reset Quiz values
  state.quizCurrentQuestion = 0;
  state.quizScore = 0;
  state.quizTimeLeft = 10;

  if (state.quizTimer) clearInterval(state.quizTimer);

  const questions = [
    { q: "What coordinate space does Three.js default to for importing meshes?", a: ["Holographic space", "Cartesian local space", "Matrix screen coordinates", "UV texture space"], correct: 1 },
    { q: "Which Spring Boot annotation configures authorization validation filters?", a: ["@EnableWebSecurity", "@SpringBootConfiguration", "@RestController", "@EntityScan"], correct: 0 },
    { q: "In GSAP, how do you trigger timeline tweens in response to scroll positions?", a: ["timeline.scroll()", "ScrollTrigger plugin", "gsap.scrollAnimation()", "TweenMax.play()"], correct: 1 }
  ];
  state.activeQuiz = { title: course?.title || 'Course Examination', questions };

  return `
    <div class="max-w-2xl mx-auto minimal-card p-8 rounded" id="quiz-workspace">
      <!-- Quiz Header -->
      <div class="flex justify-between items-center border-b border-[#1f2230] pb-4 text-xs">
        <div>
          <span class="badge-solid badge-pink">EVALUATION EXAM</span>
          <h2 class="text-base font-bold text-white mt-2">${state.activeQuiz.title}</h2>
        </div>
        <!-- Timer -->
        <div class="w-10 h-10 rounded border border-red-500/35 flex items-center justify-center font-bold text-sm text-red-500 bg-red-500/5" id="quiz-countdown">
          10
        </div>
      </div>

      <!-- Main Question Container -->
      <div id="quiz-question-box" class="py-8 flex flex-col gap-6">
        ${renderQuizQuestion()}
      </div>
    </div>
  `;
}

// Render Quiz Question
function renderQuizQuestion() {
  const qObj = state.activeQuiz.questions[state.quizCurrentQuestion];
  if (!qObj) return '';

  return `
    <div class="flex flex-col gap-4 text-xs">
      <div class="flex justify-between text-[10px] text-gray-500">
        <span>Question ${state.quizCurrentQuestion + 1} of ${state.activeQuiz.questions.length}</span>
        <span>Score: ${state.quizScore}</span>
      </div>
      <h3 class="text-sm font-bold text-white leading-relaxed pl-3 border-l-2 border-indigo-500">${qObj.q}</h3>
      <div class="grid grid-cols-1 gap-3 mt-4">
        ${qObj.a.map((opt, i) => `
          <button class="w-full text-left p-4 rounded bg-[#151722] border border-[#232737] hover:border-indigo-500/40 text-xs text-gray-300 hover:text-white transition font-medium quiz-option-btn" data-index="${i}">
            ${opt}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

// Confetti Anim
function triggerConfetti() {
  const container = document.getElementById('app');
  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    el.style.backgroundColor = ['#6366f1', '#ec4899', '#10b981'][Math.floor(Math.random() * 3)];
    el.style.left = `${window.innerWidth / 2 + (Math.random() - 0.5) * 100}px`;
    el.style.top = `${window.innerHeight / 2 + (Math.random() - 0.5) * 50}px`;
    container.appendChild(el);

    gsap.to(el, {
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 400 - 150,
      rotation: Math.random() * 360,
      opacity: 0,
      duration: 1.5 + Math.random(),
      ease: 'power3.out',
      onComplete: () => el.remove()
    });
  }
}

// --- MINIMALIST FORUM ---
async function viewForum() {
  const discussions = await api.getDiscussions();

  return `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Create thread form -->
      <div class="minimal-card p-6 rounded flex flex-col gap-4 self-start text-xs">
        <h3 class="text-xs font-bold uppercase tracking-wider text-gray-400">Launch Discussion</h3>
        <form id="form-create-thread" class="flex flex-col gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-gray-500">Thread Topic</label>
            <input type="text" id="thread-title" class="input-minimal p-2.5 text-xs" placeholder="e.g. Using WebGL matrices..." required/>
          </div>
          <button type="submit" class="btn-solid-primary w-full py-2.5 rounded text-xs font-semibold">
            Post Thread
          </button>
        </form>
      </div>

      <!-- Feed list -->
      <div class="lg:col-span-2 minimal-card p-6 rounded flex flex-col gap-4">
        <h3 class="text-xs font-bold uppercase tracking-wider text-gray-400">Active Discussions</h3>
        <div class="flex flex-col gap-4" id="discussions-feed">
          ${discussions.map(disc => `
            <div class="p-4 rounded bg-[#151722] border border-[#232737] flex justify-between items-center text-xs">
              <div>
                <h4 class="text-xs font-bold text-white hover:text-indigo-400 cursor-pointer">${disc.title}</h4>
                <p class="text-[10px] text-gray-500 mt-1">Author: ${disc.author} &bull; Date: ${disc.date}</p>
              </div>
              <div class="flex gap-4 items-center text-xs text-gray-400">
                <span>💬 ${disc.replies}</span>
                <span class="hover:text-pink-400 cursor-pointer">❤️ ${disc.likes}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// --- MINIMALIST PROFILE ---
async function viewProfile() {
  const user = state.user;
  let certificates = [];
  try {
    if (user && user.id) {
      certificates = await api.getStudentCertificates(user.id);
    }
  } catch (err) {
    console.error('Failed to load student certificates:', err);
  }

  return `
    <div class="max-w-3xl mx-auto flex flex-col gap-8 text-xs">
      <!-- Profile Card -->
      <div class="minimal-card p-8 rounded flex flex-col sm:flex-row items-center gap-6">
        <div class="w-16 h-16 rounded bg-indigo-600/10 p-1 flex items-center justify-center font-bold text-xl text-indigo-400 border border-indigo-600/20">
          ${user?.name?.substring(0, 2).toUpperCase() || 'US'}
        </div>
        <div class="flex-grow text-center sm:text-left flex flex-col gap-1">
          <h2 class="text-xl font-bold text-white">${user?.name || 'User Profile'}</h2>
          <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">// Profile Role: ${user?.role?.replace('ROLE_', '') || 'STUDENT'}</p>
        </div>
      </div>

      <!-- Skills -->
      <div class="minimal-card p-6 rounded flex flex-col gap-4">
        <h3 class="text-xs font-bold uppercase tracking-wider text-gray-400">Security Credentials & Skills</h3>
        <div class="flex flex-wrap gap-2 text-[10px]">
          <span class="badge-solid badge-cyan">WebGL shaders</span>
          <span class="badge-solid badge-pink">GSAP timelines</span>
          <span class="badge-solid badge-green">Spring Security</span>
        </div>
      </div>

      <!-- Certificate Grid -->
      <div class="flex flex-col gap-4">
        <h3 class="text-base font-bold text-white uppercase tracking-wide">Signed Credentials</h3>
        ${certificates.length === 0 ? `
          <div class="minimal-card p-8 rounded text-center text-gray-500">
            No official credentials compiled yet. Complete course evaluation modules and earn graded approvals to generate certificates.
          </div>
        ` : certificates.map(cert => `
          <div class="minimal-card p-8 rounded flex flex-col items-center text-center gap-6 relative overflow-hidden mb-4 bg-dark-bg/40">
            <span class="text-3xl">🎓</span>
            <div>
              <h4 class="text-sm font-bold text-white uppercase tracking-wider">Official Certificate of Completion</h4>
              <p class="text-[10px] text-gray-500 mt-2">Verified that <strong class="text-white">${user?.name?.toUpperCase() || 'STUDENT'}</strong> has compiled all module steps for</p>
              <p class="text-base font-bold text-indigo-400 mt-3 uppercase">${cert.course ? cert.course.title : 'Course'}</p>
            </div>

            <div class="text-[10px] font-mono text-gray-500 flex flex-col gap-1 items-center bg-[#151722] px-4 py-2.5 rounded border border-[#232737]">
              <span>Verification UUID: ${cert.verificationCode}</span>
              <span>Issued Date: ${new Date(cert.issuedAt).toLocaleDateString()}</span>
            </div>

            <button class="btn-solid-primary text-xs px-6 py-2.5 rounded btn-download-pdf" data-code="${cert.verificationCode}">
              Download Certificate PDF
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// --- EVENT HANDLERS ---
function attachEventListeners(hash) {
  const parts = hash.split('/');
  const mainRoute = parts[0];

  // Logout
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      api.logout();
      state.user = null;
      navigate('#landing');
    };
  }

  if (mainRoute === '#landing') {
    document.querySelectorAll('.faq-accordion-header').forEach(header => {
      header.onclick = () => {
        const item = header.closest('.faq-item');
        const body = item.querySelector('.faq-body');
        const icon = item.querySelector('.faq-icon');
        const isHidden = body.classList.contains('hidden');
        if (isHidden) {
          body.classList.remove('hidden');
          icon.style.transform = 'rotate(180deg)';
        } else {
          body.classList.add('hidden');
          icon.style.transform = 'rotate(0deg)';
        }
      };
    });
  }

  if (mainRoute === '#login') {
    const googleBtn = document.getElementById('btn-oauth-google');
    if (googleBtn) {
      googleBtn.onclick = async () => {
        googleBtn.textContent = 'Connecting...';
        googleBtn.disabled = true;
        try {
          const user = await api.redirectToGoogle();
          if (user) {
            state.user = user;
            navigate('#student-dashboard');
          }
        } catch (err) {
          console.error('Google OAuth error:', err);
          googleBtn.textContent = 'Google';
          googleBtn.disabled = false;
        }
      };
    }

    const githubBtn = document.getElementById('btn-oauth-github');
    if (githubBtn) {
      githubBtn.onclick = async () => {
        githubBtn.textContent = 'Connecting...';
        githubBtn.disabled = true;
        try {
          const user = await api.redirectToGithub();
          if (user) {
            state.user = user;
            navigate('#student-dashboard');
          }
        } catch (err) {
          console.error('GitHub OAuth error:', err);
          githubBtn.textContent = 'GitHub';
          githubBtn.disabled = false;
        }
      };
    }

    const form = document.getElementById('form-login');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorMsg = document.getElementById('auth-error-msg');
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Signing in...';
        submitBtn.disabled = true;
        try {
          const user = await api.login(email, password);
          state.user = user;
          if (user.role === 'ROLE_ADMIN') navigate('#admin-dashboard');
          else if (user.role === 'ROLE_TRAINER') navigate('#trainer-dashboard');
          else navigate('#student-dashboard');
        } catch (err) {
          errorMsg.textContent = err.message || 'Invalid email or password';
          errorMsg.classList.remove('hidden');
          submitBtn.textContent = 'Log In';
          submitBtn.disabled = false;
        }
      };
    }
  }

  if (mainRoute === '#register') {
    const googleRegBtn = document.getElementById('btn-oauth-register-google');
    if (googleRegBtn) {
      googleRegBtn.onclick = async () => {
        googleRegBtn.textContent = 'Connecting...';
        googleRegBtn.disabled = true;
        try {
          const user = await api.redirectToGoogle();
          if (user) {
            state.user = user;
            navigate('#student-dashboard');
          }
        } catch (err) {
          googleRegBtn.textContent = 'Google';
          googleRegBtn.disabled = false;
        }
      };
    }

    const githubRegBtn = document.getElementById('btn-oauth-register-github');
    if (githubRegBtn) {
      githubRegBtn.onclick = async () => {
        githubRegBtn.textContent = 'Connecting...';
        githubRegBtn.disabled = true;
        try {
          const user = await api.redirectToGithub();
          if (user) {
            state.user = user;
            navigate('#student-dashboard');
          }
        } catch (err) {
          githubRegBtn.textContent = 'GitHub';
          githubRegBtn.disabled = false;
        }
      };
    }

    const form = document.getElementById('form-register');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const role = document.getElementById('reg-role').value;
        const password = document.getElementById('reg-password').value;
        const successMsg = document.getElementById('auth-success-msg');
        const submitBtn = form.querySelector('button[type="submit"]');
        // Hide previous messages
        successMsg.classList.add('hidden');
        submitBtn.textContent = 'Creating Profile...';
        submitBtn.disabled = true;
        try {
          const res = await api.register(name, email, password, role);
          successMsg.textContent = res.message || 'Registration successful! Please log in.';
          successMsg.classList.remove('hidden');
          setTimeout(() => navigate('#login'), 1500);
        } catch (err) {
          successMsg.textContent = err.message || 'Registration failed. Please try again.';
          successMsg.style.color = '#f87171';
          successMsg.style.borderColor = 'rgba(239, 68, 68, 0.3)';
          successMsg.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
          successMsg.classList.remove('hidden');
          submitBtn.textContent = 'Create Profile';
          submitBtn.disabled = false;
        }
      };
    }
  }

  if (mainRoute === '#trainer-dashboard') {
    // Grade Submit
    document.querySelectorAll('.btn-grade-submit').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-id');
        const grade = document.getElementById(`input-grade-${id}`).value;
        const feedback = document.getElementById(`input-feedback-${id}`).value;
        if (!grade) return;
        try {
          await api.gradeSubmission(id, grade, feedback);
          router(); // Refresh
        } catch (err) {
          console.error('Failed to grade submission:', err);
        }
      };
    });

    // Create course
    const createCourseForm = document.getElementById('form-create-course');
    if (createCourseForm) {
      createCourseForm.onsubmit = async (e) => {
        e.preventDefault();
        const title = document.getElementById('course-title').value;
        const category = document.getElementById('course-category').value;
        const difficulty = document.getElementById('course-difficulty').value;
        const duration = document.getElementById('course-duration').value;
        const successMsg = document.getElementById('trainer-success-msg');

        try {
          await api.addCourse({ 
            title, 
            category, 
            difficulty, 
            duration: parseInt(duration), 
            instructor: state.user?.name || 'Trainer' 
          });
          successMsg.textContent = 'Course published successfully.';
          successMsg.classList.remove('hidden');
          createCourseForm.reset();
          setTimeout(() => {
            successMsg.classList.add('hidden');
            router(); // Refresh
          }, 1200);
        } catch (err) {
          console.error('Failed to add course:', err);
        }
      };
    }
  }

  if (mainRoute === '#admin-dashboard') {
    // Change User Roles
    document.querySelectorAll('.btn-change-role').forEach(btn => {
      btn.onclick = async () => {
        const userId = btn.getAttribute('data-id');
        const role = btn.getAttribute('data-role');
        try {
          await api.updateUserRole(userId, role);
          router(); // Refresh
        } catch (err) {
          console.error('Failed to change role:', err);
        }
      };
    });
  }

  if (mainRoute === '#courses' && parts[1]) {
    // Submit Assignment
    const submitAssignmentForm = document.getElementById('form-submit-assignment');
    if (submitAssignmentForm) {
      submitAssignmentForm.onsubmit = async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('assignment-file');
        const file = fileInput.files[0];
        const successMsg = document.getElementById('assignment-success-msg');
        if (!file) return;

        if (state.user && state.user.id) {
          try {
            await api.submitAssignment(state.user.id, parseInt(parts[1]), file.name);
            successMsg.textContent = 'Project package submitted successfully.';
            successMsg.classList.remove('hidden');
            submitAssignmentForm.reset();
            setTimeout(() => {
              successMsg.classList.add('hidden');
              router(); // Refresh
            }, 1500);
          } catch (err) {
            console.error('Failed to submit assignment:', err);
          }
        }
      };
    }
  }

  if (mainRoute === '#courses' && !parts[1]) {
    // Category Filter
    document.querySelectorAll('.category-filter-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.category-filter-btn').forEach(b => {
          b.className = 'btn-solid-secondary px-4 py-1.5 category-filter-btn';
        });
        btn.className = 'btn-solid-primary px-4 py-1.5 category-filter-btn';

        const category = btn.getAttribute('data-category');
        const grid = document.getElementById('courses-catalog-grid');
        const cards = grid.children;
        for (let card of cards) {
          if (category === 'all' || card.getAttribute('data-category') === category) {
            card.classList.remove('hidden');
          } else {
            card.classList.add('hidden');
          }
        }
      };
    });

    // Search bar
    const searchBar = document.getElementById('input-search-courses');
    if (searchBar) {
      searchBar.oninput = () => {
        const val = searchBar.value.toLowerCase();
        const grid = document.getElementById('courses-catalog-grid');
        const cards = grid.children;
        for (let card of cards) {
          const title = card.querySelector('h3').textContent.toLowerCase();
          if (title.includes(val)) {
            card.classList.remove('hidden');
          } else {
            card.classList.add('hidden');
          }
        }
      };
    }
  }

  if (mainRoute === '#quiz' && parts[1]) {
    startQuizTimer(parts[1]);

    // Handle Quiz Options clicks
    document.querySelectorAll('.quiz-option-btn').forEach(btn => {
      btn.onclick = async () => {
        const optionIndex = parseInt(btn.getAttribute('data-index'));
        const currentQ = state.activeQuiz.questions[state.quizCurrentQuestion];
        if (optionIndex === currentQ.correct) {
          state.quizScore++;
        }

        state.quizCurrentQuestion++;
        if (state.quizCurrentQuestion < state.activeQuiz.questions.length) {
          state.quizTimeLeft = 10;
          const box = document.getElementById('quiz-question-box');
          if (box) box.innerHTML = renderQuizQuestion();
          attachEventListeners(hash);
        } else {
          if (state.quizTimer) clearInterval(state.quizTimer);
          const workspace = document.getElementById('quiz-workspace');
          
          if (state.user && state.user.id) {
            try {
              // Simulate quiz auto-submission for course progress
              await api.submitAssignment(state.user.id, parseInt(parts[1]), 'exam-results.txt');
              // Auto-grade exam
              const subs = await api.getStudentSubmissions(state.user.id);
              const activeSub = subs.find(s => {
                const subCourseId = s.course ? s.course.id : s.courseId;
                return String(subCourseId) === String(parts[1]) && s.submissionFile === 'exam-results.txt';
              });
              if (activeSub) {
                const passed = state.quizScore >= 2;
                await api.gradeSubmission(activeSub.id, passed ? 'A' : 'F', passed ? 'Passed evaluation exam.' : 'Failed evaluation exam. Please retry.');
              }
            } catch (err) {
              console.error('Failed to submit quiz results:', err);
            }
          }

          workspace.innerHTML = `
            <div class="text-center py-8 flex flex-col gap-6 items-center text-xs">
              <span class="text-3xl">🏆</span>
              <h2 class="text-lg font-bold text-white">Evaluation Complete</h2>
              <p class="text-xs text-gray-400">Score: <strong class="text-indigo-400">${state.quizScore} / ${state.activeQuiz.questions.length}</strong></p>
              <div class="flex gap-3">
                <a href="#profile" class="btn-solid-primary text-xs px-5 py-2">View Certificate</a>
                <a href="#student-dashboard" class="btn-solid-secondary text-xs px-5 py-2">Back to Dashboard</a>
              </div>
            </div>
          `;
          triggerConfetti();
        }
      };
    });
  }

  if (mainRoute === '#forum') {
    const threadForm = document.getElementById('form-create-thread');
    if (threadForm) {
      threadForm.onsubmit = async (e) => {
        e.preventDefault();
        const title = document.getElementById('thread-title').value;
        const author = state.user?.name || 'Anonymous Student';
        await api.addDiscussion(title, author);
        threadForm.reset();
        router(); // refresh
      };
    }
  }

  if (mainRoute === '#profile') {
    document.querySelectorAll('.btn-download-pdf').forEach(btn => {
      btn.onclick = () => {
        const code = btn.getAttribute('data-code');
        alert("Initializing PDF Certificate download sequence...");
        window.open(`http://localhost:8080/api/certificates/download/${code}`, '_blank');
      };
    });
  }
}

// Quiz Clock Timer
function startQuizTimer(courseId) {
  const clock = document.getElementById('quiz-countdown');
  if (!clock) return;

  state.quizTimer = setInterval(() => {
    // Assert if clock element is still in DOM (user hasn't navigated away)
    const currentClock = document.getElementById('quiz-countdown');
    if (!currentClock) {
      clearInterval(state.quizTimer);
      state.quizTimer = null;
      return;
    }

    state.quizTimeLeft--;
    currentClock.textContent = state.quizTimeLeft;

    if (state.quizTimeLeft <= 0) {
      state.quizCurrentQuestion++;
      if (state.quizCurrentQuestion < state.activeQuiz.questions.length) {
        state.quizTimeLeft = 10;
        const box = document.getElementById('quiz-question-box');
        if (box) box.innerHTML = renderQuizQuestion();
        attachEventListeners(`#quiz/${courseId}`);
      } else {
        clearInterval(state.quizTimer);
        state.quizTimer = null;
        const workspace = document.getElementById('quiz-workspace');
        if (workspace) {
          workspace.innerHTML = `
            <div class="text-center py-8 flex flex-col gap-6 items-center">
              <span class="text-3xl">⏰</span>
              <h2 class="text-base font-bold text-white uppercase">Evaluation Timeout</h2>
              <div class="flex gap-3 mt-2">
                <a href="#student-dashboard" class="btn-solid-secondary text-xs px-5 py-2">Back to Dashboard</a>
              </div>
            </div>
          `;
        }
      }
    }
  }, 1000);
}

// Initialize Charts
function initializeWidgets(hash) {
  const mainRoute = hash.split('/')[0];
  if (mainRoute === '#student-dashboard' || mainRoute === '#dashboard') {
    const ctx = document.getElementById('student-activity-chart');
    if (ctx) {
      SkillsphereCharts.createLineChart(
        ctx,
        ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        [1.2, 2.5, 0.8, 3.2, 4.0, 1.5, 5.3],
        'Learning Hours',
        '#6366f1' // Solid Indigo
      );
    }
  }
}
