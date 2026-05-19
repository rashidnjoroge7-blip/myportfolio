export type Project = {
  id: number;
  title: string;
  description: string;
  tags: string[];
  link: string;
  image: string;
};

export const siteConfig = {
  name: "Unihost Technologies",
  company: "Unihost Technologies",
  email: "info@unihost.co.ke",
  phone: "+254764000664",
  location: "Nairobi, Kenya",
  github: "https://github.com/yourprofile",
  linkedin: "https://linkedin.com/in/yourprofile",
  twitter: "https://twitter.com/yourprofile",
  facebook: "https://facebook.com/yourprofile",
  tagline: "Full-stack developer building modern web experiences",
  projects: [
    {
      id: 1,
      title: "E-Commerce Platform",
      description: "A full-stack e-commerce solution with real-time inventory management and payment processing.",
      tags: ["React", "Next.js", "PostgreSQL", "Stripe"],
      link: "https://github.com/yourprofile/e-commerce-platform",
      image: "🛍️",
    },
    {
      id: 2,
      title: "Task Management App",
      description: "Collaborative task management tool with real-time updates and team collaboration features.",
      tags: ["React", "TypeScript", "Firebase"],
      link: "https://github.com/yourprofile/task-management-app",
      image: "✅",
    },
    {
      id: 3,
      title: "Analytics Dashboard",
      description: "Comprehensive analytics dashboard with real-time data visualization and reporting.",
      tags: ["Next.js", "D3.js", "Node.js"],
      link: "https://github.com/yourprofile/analytics-dashboard",
      image: "📊",
    },
    {
      id: 4,
      title: "Social Media App",
      description: "A modern social networking platform with messaging, notifications, and feed algorithms.",
      tags: ["React", "Node.js", "MongoDB"],
      link: "https://github.com/yourprofile/social-media-app",
      image: "👥",
    },
    {
      id: 5,
      title: "Weather Application",
      description: "Real-time weather app with location services and 7-day forecast predictions.",
      tags: ["React", "OpenWeather API", "Tailwind"],
      link: "https://github.com/yourprofile/weather-application",
      image: "🌤️",
    },
    {
      id: 6,
      title: "Video Streaming Platform",
      description: "Scalable video streaming platform with adaptive bitrate and multi-region deployment.",
      tags: ["React", "WebRTC", "AWS"],
      link: "https://github.com/yourprofile/video-streaming-platform",
      image: "🎬",
    },
  ] as Project[],
};
