<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## 11. Approved Technology Stack and AI Recommendation Policy

UniHost Technologies maintains a defined technology ecosystem. All AI-assisted project discovery, technical recommendations, project estimates and implementation plans must respect this ecosystem.

### 11.1 Approved Technology Ecosystem

The primary approved technologies are:

#### A. Modern Web Applications

- Next.js as the primary application framework.
- React as the frontend library.
- Tailwind CSS for styling and responsive interfaces.
- TypeScript for type safety.
- Supabase for database, authentication and backend services where appropriate.
- NextAuth for authentication where appropriate.

#### B. WordPress Websites and CMS Solutions

- WordPress as the approved CMS.
- Elementor Pro as the primary visual page builder.
- PHP for WordPress backend customization.
- JavaScript and CSS for frontend enhancements.
- WordPress REST API and approved WordPress hooks and filters.
- ACF Pro and WooCommerce where project requirements justify their use.
- Compatible WordPress plugins for additional functionality.

Do not introduce alternative page builders or competing CMS platforms without explicit project approval.

#### C. Payment Integration

M-Pesa is the primary approved mobile payment solution for Kenyan projects.

Preferred integration options:

- Safaricom Daraja API.
- M-Pesa STK Push.
- C2B payment integration.
- B2C integration where applicable.
- Transaction status verification.
- Secure payment callbacks and webhooks.
- Approved M-Pesa payment gateway providers where appropriate.

Payment implementations must include:
- Secure server-side API communication.
- Transaction verification.
- Callback validation.
- Idempotency and duplicate transaction protection.
- Secure credential management.
- Payment status tracking.
- Appropriate transaction logging.
- Clear handling of failed, pending and successful payments.

Never expose M-Pesa credentials, consumer secrets, passkeys or access tokens in frontend code.

### 11.2 AI Technology Restrictions

The UniHost AI Project Guide must recommend solutions primarily within the approved technology ecosystem.

When assisting clients:

1. Recommend Next.js, React and Tailwind CSS for suitable modern web applications.
2. Recommend WordPress with Elementor Pro for suitable CMS-driven websites.
3. Recommend M-Pesa for Kenyan payment requirements.
4. Recommend compatible databases, APIs, plugins and supporting dependencies.
5. Explain the difference between WordPress websites and custom Next.js applications in language non-technical clients can understand.
6. Avoid recommending unnecessary technologies that increase project costs or maintenance requirements.
7. Do not recommend replacing an established project technology without explaining the business and technical justification.
8. Do not promise integrations or capabilities that have not been technically validated.

### 11.3 Technology Selection Rules

The AI must determine the client's actual requirements before recommending a solution.

Examples:

- Business website: WordPress + Elementor Pro.
- Content-managed corporate website: WordPress + Elementor Pro.
- Custom interactive web application: Next.js + React + Tailwind CSS.
- Client portal: Next.js + React + Tailwind CSS with an appropriate backend.
- Kenyan online payment functionality: M-Pesa integration.
- E-commerce website: WordPress and compatible WooCommerce components where suitable.
- Custom business management system: Next.js + React + Tailwind CSS with an appropriate database and backend.

These are starting recommendations, not rigid prescriptions. Final architecture must be based on project requirements, security, budget, scalability and maintainability.

### 11.4 Dependency Management

When proposing additional dependencies:

- Prefer established libraries compatible with the approved stack.
- Check compatibility with installed framework versions.
- Avoid unnecessary overlapping dependencies.
- Consider licensing, maintenance, security and ongoing costs.
- Prefer official APIs and supported integration methods.
- Never install packages or modify project dependencies without an appropriate development decision.
- Document significant new dependencies and their purpose.

### 11.5 Exceptions

Technologies outside the approved ecosystem may only be recommended when:

1. The client's requirements cannot reasonably be met using the approved stack.
2. There is a clear technical or commercial justification.
3. The alternative's costs, risks and maintenance implications are explained.
4. The project owner approves the exception.

The AI must not silently expand the approved technology stack.

### 11.6 AI Communication Rules

The AI should explain technical recommendations without overwhelming non-technical clients.

It should:
- Use simple language.
- Explain technical terms when necessary.
- Present practical options within the approved ecosystem.
- Explain expected benefits and limitations.
- Consider the client's budget and business objectives.
- Avoid presenting technical complexity as a requirement when a simpler solution is sufficient.

The AI acts as a project discovery and technical guidance assistant. Final technical architecture and implementation decisions remain subject to UniHost Technologies' approval.

## 12. Development and Change Management Rules

- Inspect existing implementation before changing files.
- Preserve unrelated user changes and historical backups.
- Do not use destructive Git commands without explicit approval.
- Do not stage all files indiscriminately.
- Review source changes and database migrations before committing.
- Never expose, commit or request environment secrets.
- Validate TypeScript, linting and production builds where applicable.
- Use server-side validation for security-sensitive operations.
- Enforce authentication and authorisation on protected server actions.
- Treat client input as untrusted.
- Record significant workflow and database changes in PROJECT_ROADMAP.md.
- Do not mark a feature complete until its acceptance criteria and relevant tests pass.

## 13. Contract and Client Acceptance Rules

- An accepted quotation is not an executed contract.
- Do not activate implementation merely because a quotation was accepted.
- Require the approved contract and the required signatures before normal project activation.
- Confirm required deposits or initial payments where the contract makes them a prerequisite.
- Preserve the exact contract version signed by both parties.
- Record amendments as separate, traceable contract versions.
- Keep quotation acceptance, contract execution, milestone acceptance and final project acceptance as separate events.
- Require documented client acceptance for contractual milestones, subject to valid acceptance mechanisms expressly agreed in the contract.
- Generate a final Project Completion and Acceptance Certificate.
- Enforce contract and project status transitions on the server.
- Restrict contract documents and signature evidence to authorised users.
- Apply applicable privacy, electronic-signature, records-retention and governing-law requirements.
- Do not present a generated contract template as legally approved until it has received appropriate legal review.

## 14. Git and Release Milestones

- Check the current branch, upstream and working-tree status before staging.
- Stage only explicitly reviewed files.
- Inspect staged changes with git diff --cached.
- Run git diff --cached --check before committing.
- Use descriptive commit messages for logical milestones.
- Keep backups, local configuration and secrets out of commits.
- Push only to the confirmed project remote and branch.
- Never force-push as a routine workflow.
- Verify the remote branch after pushing.
- Treat deployment verification as a separate milestone from Git commit and push.
