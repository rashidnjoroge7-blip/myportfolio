export type Tech = {
  slug: string;
  name: string;
  icon?: string;
  category?: string;
  summary?: string;
  why?: string;
  usage: string;
  docs?: string;
  features: string[];
  useCases?: string[];
  bestFor?: string[];
  examples?: string[];
  pros?: string[];
  cons?: string[];
  setup?: string[];
  sampleCode?: string;
  resources?: { label: string; url: string }[];
};

export const TECHS: Tech[] = [
  {
    slug: "react",
    name: "React",
    icon: "⚛️",
    category: "Frontend",
    summary: "UI library for building component-driven applications.",
    why: "React helps teams iterate fast with reusable UI components and predictable rendering.",
    usage: "Build interactive UIs using reusable components and state management.",
    docs: "https://reactjs.org/",
    features: ["Component-based UI", "Virtual DOM", "Hooks API"],
    useCases: [
      "Single-page applications",
      "Design systems and UI libraries",
      "Interactive dashboards and data visualizations",
    ],
    bestFor: [
      "Building reusable UI components",
      "Handling dynamic client-side interaction",
      "Creating cross-platform React Native apps with shared patterns",
    ],
    examples: [
      "Create a dashboard with live charts and filters.",
      "Build a multi-step form with controlled inputs.",
      "Develop a design system with reusable buttons and cards.",
    ],
    pros: [
      "Huge ecosystem and community",
      "Excellent component reusability",
      "Strong ecosystem for testing and tooling",
    ],
    cons: [
      "Frequent breaking changes in ecosystem libraries",
      "Requires architectural decisions for state management",
    ],
    setup: [
      "Install with `npx create-react-app my-app --template typescript` or use Vite",
      "Organize components, hooks, and utilities folders",
      "Add testing with Jest + React Testing Library",
    ],
    sampleCode:
      "// Example React component\nimport React from 'react';\nexport function Counter(){ const [n, setN] = React.useState(0); return (<div><button onClick={()=>setN(n+1)}>{n}</button></div>)}",
    resources: [
      { label: "React Docs", url: "https://reactjs.org/" },
      { label: "React Hooks FAQ", url: "https://reactjs.org/docs/hooks-faq.html" },
    ],
  },

  {
    slug: "nextjs",
    name: "Next.js",
    icon: "⛳",
    category: "Framework",
    summary: "React framework for hybrid static and server rendering.",
    why: "Next.js combines server and client rendering for fast, SEO-friendly experiences.",
    usage: "Build fast production apps with routing, APIs, and optimized rendering.",
    docs: "https://nextjs.org/",
    features: ["File-system routing", "Server Components", "ISR/SSG/SSR"],
    useCases: ["Static marketing sites", "Server-rendered dashboards", "API route backends for frontend apps"],
    bestFor: [
      "SEO-friendly websites",
      "Content-heavy static sites",
      "Applications that need both SSR and client hydration",
    ],
    examples: [
      "Build a blog with SSG and incremental updates.",
      "Create a dashboard with server-side authenticated pages.",
      "Add API routes for form submissions and data feeds.",
    ],
    pros: ["Built-in routing and data fetching patterns", "Great defaults for performance and SEO"],
    cons: ["Server/client boundaries can be confusing", "Build size and configuration can grow"],
    setup: [
      "Create app with `npx create-next-app@latest --ts`",
      "Use `app/` or `pages/` routing depending on requirements",
      "Configure image and caching optimizations as needed",
    ],
    sampleCode: "// simple Next.js page\nexport default function Page(){ return <h1>Hello from Next.js</h1> }",
    resources: [{ label: "Next.js Docs", url: "https://nextjs.org/docs" }],
  },

  {
    slug: "typescript",
    name: "TypeScript",
    icon: "🟦",
    category: "Language",
    summary: "Typed superset of JavaScript for safer code.",
    why: "TypeScript catches bugs early and makes large codebases easier to maintain.",
    usage: "Add type safety, better tooling, and clearer APIs to JavaScript projects.",
    docs: "https://www.typescriptlang.org/",
    features: ["Static typing", "Type inference", "Improved DX"],
    useCases: ["Large codebases with many contributors", "Library and SDK development", "Complex frontend and backend applications"],
    bestFor: ["Preventing runtime type errors", "Improving editor autocompletion", "Making refactors safer and faster"],
    examples: [
      "Define reusable types for API responses.",
      "Use discriminated unions for state machines.",
      "Add strict typing to component props.",
    ],
    pros: ["Improves developer experience", "Reduces runtime errors"],
    cons: ["Learning curve for strict typing", "Extra build step for type checking"],
    setup: [
      "Install with `npm i -D typescript @types/node` and add `tsconfig.json`",
      "Migrate files from .js to .ts/.tsx incrementally",
    ],
    sampleCode: "type User = { id: string; name: string }; function greet(u: User){ return `Hello ${u.name}` }",
    resources: [{ label: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/handbook/intro.html" }],
  },

  {
    slug: "tailwind-css",
    name: "Tailwind CSS",
    icon: "🎨",
    category: "Styling",
    summary: "Utility-first CSS framework for rapid UI development.",
    why: "Tailwind lets you ship polished UI quickly without writing lots of custom CSS.",
    usage: "Compose styles directly in markup with small utility classes.",
    docs: "https://tailwindcss.com/",
    features: ["Utility-first", "Responsive variants", "Plugin ecosystem"],
    useCases: ["Rapid prototyping of landing pages", "Consistent responsive UI styling", "Design system implementation without custom CSS"],
    bestFor: ["Speeding up frontend styling", "Creating responsive layouts quickly", "Keeping classes consistent across projects"],
    examples: [
      "Build a responsive hero section with spacing utilities.",
      "Style a card grid using Tailwind layout classes.",
      "Add dark mode support with variant utilities.",
    ],
    pros: ["Rapid styling and prototyping", "Small final CSS when purged"],
    cons: ["Verbose classnames in markup", "Requires mental model shift from traditional CSS"],
    setup: [
      "Install via PostCSS or as a framework with `npm i tailwindcss`",
      "Add `tailwind.config.js` and include directives in your CSS",
    ],
    sampleCode: "<div className=\"p-6 bg-white rounded-lg shadow\">Hello Tailwind</div>",
    resources: [{ label: "Tailwind Docs", url: "https://tailwindcss.com/docs" }],
  },

  {
    slug: "nodejs",
    name: "Node.js",
    icon: "🟢",
    category: "Backend",
    summary: "JavaScript runtime for building backend services.",
    why: "Node.js provides a fast runtime for building APIs and server-side tools in JavaScript.",
    usage: "Run server-side code, APIs, and tooling with JavaScript.",
    docs: "https://nodejs.org/",
    features: ["Event-driven", "Non-blocking I/O", "Huge ecosystem"],
    useCases: ["REST and GraphQL APIs", "Serverless functions and microservices", "CLI tools and build scripts"],
    bestFor: ["Fast I/O-bound services", "Unified JavaScript full-stack development", "Real-time features like websockets"],
    examples: [
      "Create an API server with Express or Fastify.",
      "Run background jobs with worker processes.",
      "Use Node scripts to automate builds and deployments.",
    ],
    pros: ["Single language across stack", "Large package ecosystem (npm)"],
    cons: ["Callback/async complexity for newcomers", "Performance for CPU-bound tasks"],
    setup: ["Install Node.js LTS", "Use package manager (npm/yarn/pnpm)", "Choose a framework (Express, Fastify, Nest)"],
    sampleCode: "// Express example\nimport express from 'express'; const app = express(); app.get('/', (req,res)=>res.send('Hello')); app.listen(3000)",
    resources: [{ label: "Node.js Docs", url: "https://nodejs.org/en/docs/" }],
  },

  {
    slug: "postgresql",
    name: "PostgreSQL",
    icon: "🐘",
    category: "Database",
    summary: "Open-source relational database for reliable storage.",
    why: "PostgreSQL offers reliable transactions and powerful query capabilities for real apps.",
    usage: "Store structured data with strong consistency and SQL support.",
    docs: "https://www.postgresql.org/",
    features: ["ACID compliance", "Advanced queries", "Extensions"],
    useCases: ["Transactional application databases", "Analytical reporting and BI", "Spatial and JSON data storage"],
    bestFor: ["Reliable transaction processing", "Complex query requirements", "Schema-driven data models"],
    examples: [
      "Design normalized tables for users and orders.",
      "Use JSONB for semi-structured data.",
      "Add PostGIS for geographic queries.",
    ],
    pros: ["Reliable and battle-tested", "Powerful SQL features and extensions"],
    cons: ["Operational overhead for scaling", "Requires schema planning"],
    setup: ["Install via package manager or Docker image", "Initialize database and users", "Use migrations (Flyway, Liquibase, or node-pg-migrate)"],
    sampleCode: "-- Create table example\nCREATE TABLE users (id serial PRIMARY KEY, name text NOT NULL);",
    resources: [{ label: "Postgres Docs", url: "https://www.postgresql.org/docs/" }],
  },

  {
    slug: "docker",
    name: "Docker",
    icon: "🐳",
    category: "DevOps",
    summary: "Container platform for packaging and shipping apps.",
    why: "Docker keeps development, testing, and production environments in sync with containers.",
    usage: "Build, run, and deploy applications consistently across environments.",
    docs: "https://www.docker.com/",
    features: ["Containerization", "Immutable images", "Isolation"],
    useCases: ["Containerized app deployments", "Local development parity", "CI/CD build and test environments"],
    bestFor: ["Ensuring consistent environments", "Deploying microservices", "Packaging dependencies with applications"],
    examples: [
      "Create a Dockerfile for a Node.js app.",
      "Run a service stack with Docker Compose.",
      "Use containers in CI pipelines.",
    ],
    pros: ["Environment parity", "Good tooling for CI/CD"],
    cons: ["Image size and security considerations", "Learning container orchestration for production"],
    setup: ["Install Docker Desktop or Docker Engine", "Write a Dockerfile and build images", "Use Docker Compose for local stacks"],
    sampleCode: "# Dockerfile example\nFROM node:18-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nCMD [\"node\",\"index.js\"]",
    resources: [{ label: "Docker Docs", url: "https://docs.docker.com/" }],
  },

  {
    slug: "aws",
    name: "AWS",
    icon: "☁️",
    category: "Cloud",
    summary: "Cloud platform for hosting and scaling applications.",
    why: "AWS gives you scalable, global infrastructure without managing servers yourself.",
    usage: "Use managed cloud services for compute, storage, and infrastructure.",
    docs: "https://aws.amazon.com/",
    features: ["Managed services", "Global regions", "Autoscaling"],
    useCases: ["Cloud hosting for web apps", "Object storage and media delivery", "Managed databases and serverless APIs"],
    bestFor: ["Deploying scalable infrastructure", "Using managed services instead of self-hosting", "Global applications with low-latency regions"],
    examples: [
      "Host a web app on ECS or Lambda.",
      "Store files in S3 and serve them from CloudFront.",
      "Run a managed database in Amazon RDS.",
    ],
    pros: ["Huge service catalog", "Scales to any size"],
    cons: ["Complex pricing and service surface", "Vendor lock-in concerns"],
    setup: ["Create an AWS account", "Use IAM for secure credentials", "Use CloudFormation or Terraform for infra as code"],
    sampleCode: "# Example: deploy a static site to S3 via AWS CLI\naws s3 sync ./public s3://my-bucket --acl public-read",
    resources: [{ label: "AWS Getting Started", url: "https://aws.amazon.com/getting-started/" }],
  },
];

export function getTechBySlug(slug: string) {
  const normalized = slug?.toString().trim().toLowerCase();
  if (!normalized) return null;
  return TECHS.find((t) => t.slug.toLowerCase() === normalized) ?? null;
}
