# UniHost Technologies - Master Project Roadmap

## 1. Vision

UniHost Technologies is evolving from a developer portfolio into an automated digital solutions and client delivery platform.

The platform should allow technical and non-technical clients to:

1. Understand available services.
2. Explain their business ideas.
3. Receive technology recommendations.
4. Define project requirements.
5. Obtain preliminary estimates.
6. Request and approve quotations.
7. Review and accept the approved quotation.
8. Review and execute the formal service contract.
9. Make payments through M-Pesa where required by the executed contract.
10. Track project progress and review milestone submissions.
11. Review final deliverables.
12. Approve project milestones and final completion.

The platform should automate repetitive activities while preserving administrator control over important business decisions.

## 2. Architectural Principle

Extend the existing Next.js application and database.

Do not build parallel systems for functionality that already exists.

Existing application components are the foundation:

- Public website
- Project estimator
- Quotation system
- Admin dashboard
- Client portal
- Supabase integration
- Email functionality
- Authentication
- Project milestones

New features must integrate with these components.

Avoid introducing unnecessary frameworks, services, database tables or dependencies.

## 3. Approved Technology Stack

### Custom applications

- Next.js
- React
- TypeScript
- Tailwind CSS

### CMS websites

- WordPress
- Elementor Pro
- PHP
- WordPress APIs
- ACF Pro and WooCommerce where appropriate

### Backend and data

- Supabase
- PostgreSQL
- Existing authentication architecture
- Existing server-side application utilities

### Payments

- Safaricom Daraja API
- M-Pesa STK Push
- M-Pesa transaction callbacks
- Approved payment gateway providers where appropriate

### AI

AI services must integrate through server-side application logic.

AI recommendations must remain within the approved UniHost technology ecosystem.

## 4. Existing Application Structure

### Public website

- src/app/page.tsx
- src/app/contact/
- src/app/projects/
- src/app/tech/
- src/app/testimonials/

### Quotations and estimation

- src/app/quote/
- src/app/quote/[token]/
- src/app/project-estimator/
- src/app/api/quote/
- src/lib/projectEstimator.ts

### Administration

- src/app/admin/
- src/app/api/admin/
- src/lib/adminAuth.ts
- src/lib/authOptions.ts
- src/lib/supabaseAdmin.ts

### Client portal

- src/app/client/login/
- src/app/client/dashboard/

### Shared utilities

- src/components/
- src/lib/

Do not create duplicate versions of these application areas.

## 5. Existing Database Responsibilities

The following existing tables are part of the application architecture:

### quote_requests

Responsible for:
- Client quotation requests
- Project descriptions
- Contact information
- Project requirements
- Estimator submissions
- Preliminary estimate information
- Quotation status and administrative notes

### projects

Responsible for:
- Public portfolio projects
- Project descriptions
- Images
- Categories
- Technologies
- Publication status

### client_projects

Responsible for:
- Actual client projects
- Client association
- Project titles
- Project status
- Project creation

### milestones

Responsible for:
- Project stages
- Milestone descriptions
- Due dates
- Progress status
- Client approval requirements

Before changing database structures, inspect the actual Supabase schema and existing relationships.

Do not assume that the schema contains columns that have not been verified.

## 6. Unified Client Workflow

### Stage 1: Discovery

The client visits the homepage and starts a project.

The client may:
- Use the existing quotation form.
- Use the existing project estimator.
- Use the future AI Project Guide.

The AI asks questions in simple language and helps the client describe the intended solution.

### Stage 2: Project requirements

The system prepares a structured project brief containing:

- Client details
- Business objectives
- Project type
- Required functionality
- Preferred platform
- Integrations
- Budget expectations
- Timeline expectations
- Additional requirements

The client must be able to review and confirm the information.

### Stage 3: Technology recommendation

The AI recommends a suitable solution within the approved ecosystem.

Examples:

- Business websites: WordPress and Elementor Pro.
- Corporate websites: WordPress and Elementor Pro.
- Custom applications: Next.js, React and Tailwind CSS.
- Client portals: Next.js, React and Tailwind CSS.
- E-commerce: WordPress and WooCommerce where appropriate.
- Kenyan online payments: M-Pesa integration.

Recommendations must consider the client's requirements, budget and long-term maintenance.

### Stage 4: Estimation

Reuse:

- src/lib/projectEstimator.ts
- src/app/project-estimator/

The existing estimator remains responsible for deterministic preliminary calculations.

AI must not invent prices or replace the approved pricing rules.

### Stage 5: Quotation request

Use the existing quote_requests workflow.

AI-generated briefs and estimator submissions should eventually enter the same quotation process.

Avoid creating a separate AI quotation database.

### Stage 6: Administrative review

An administrator reviews:

- Project requirements
- Technology recommendation
- Preliminary estimate
- Project scope
- Budget
- Timeline

The administrator can approve, revise or reject the proposed quotation.

Only approved quotations may be sent as official offers.

### Stage 7: Client quotation acceptance

The client receives the approved quotation.

The client can:

- Review the scope.
- Ask questions.
- Accept the quotation.
- Request revisions.
- Decline the proposal.

Record the client's decision and response timestamp.

Quotation acceptance is not the same as contract execution.

### Stage 8: Contract generation, review and signing

After quotation acceptance, initiate the Contract Management process.

The system must:

- Generate a formal service contract using the approved quotation and client details.
- Include the agreed scope, deliverables, exclusions, pricing, payment terms, milestones, responsibilities and applicable legal provisions.
- Support internal contract review and approval.
- Allow the client to review the contract and request amendments.
- Maintain contract versions and an audit trail.
- Support secure electronic signing by the client and UniHost's authorized representative.
- Preserve the executed contract as an immutable, downloadable record.

The contract becomes executed only after all required signatures have been completed.

Quotation acceptance and contract execution must remain separate recorded events.

### Stage 9: M-Pesa payment

Integrate M-Pesa through Safaricom Daraja API where payment is required by the executed contract.

Required safeguards:

- Server-side credential management.
- Secure payment initiation.
- Callback verification.
- Transaction reference storage.
- Duplicate transaction protection.
- Payment status tracking.
- Failed and pending payment handling.

Never treat an unverified callback as proof of payment.

### Stage 10: Project creation and contract activation

Create and activate the project only after the required commercial conditions have been satisfied.

These conditions include:

- Accepted quotation.
- Fully executed contract.
- Required initial payment confirmation, where applicable.
- Contract effective date reached, where applicable.
- Required administrative kickoff approval.

Then:

- Create the client project using the existing client_projects structure.
- Associate it with the originating quotation.
- Associate the client account.
- Link the executed contract.
- Initialize the project workflow.
- Notify the client.

Prevent duplicate project creation for the same quotation.

### Stage 11: Project execution and milestone acceptance

Reuse the existing milestones functionality.

The system should:

- Track project stages and progress.
- Record milestone deliverables.
- Notify clients about progress and submissions.
- Allow clients to review submitted milestones.
- Record milestone acceptance or rejection.
- Capture client feedback and requested corrections.
- Support resubmission and subsequent approval.
- Notify administrators of pending approvals.

A submitted milestone must not automatically be treated as accepted.

### Stage 12: Final delivery and client acceptance

The administrator reviews the final deliverables.

The client receives a final delivery notification and can review the completed work.

The system must:

- Record final client acceptance.
- Handle outstanding corrections where necessary.
- Generate a Project Completion and Acceptance Certificate.
- Preserve the certificate and final delivery records.
- Record the final acceptance date.
- Close the project only after the required approvals and acceptance conditions are satisfied.
## 7. Automation and Approval Rules

The following operations may be automated:

- AI-assisted discovery
- Project brief preparation
- Technology recommendations
- Preliminary estimation
- Notifications
- Reminder emails
- Project progress calculations
- Payment status updates after verification
- Document preparation
- Administrative dashboard summaries

The following operations require explicit authorization:

- Final pricing approval
- Official quotation issuance
- Changes to approved project scope
- Project kickoff
- Refunds and payment exceptions
- Important milestone approvals
- Final project closure

AI must never bypass these approval gates.

## 8. AI Project Guide

Proposed location:

- src/app/ai-assistant/
- src/app/api/ai/

These are proposed locations, not existing functionality.

The AI Project Guide should:

1. Understand client business ideas.
2. Ask relevant follow-up questions.
3. Explain technical concepts in plain language.
4. Recommend WordPress or Next.js appropriately.
5. Identify required functionality.
6. Prepare structured project briefs.
7. Guide clients through the existing estimator.
8. Explain quotation processes.
9. Help clients understand project milestones.
10. Direct clients to human support when necessary.

AI-generated information must be clearly distinguished from administrator-approved business information.

The AI must not:
- Approve quotations.
- Promise prices.
- Promise delivery dates.
- Confirm payments without verification.
- Modify protected project records without authorization.
- Expose another client's information.

Initially, the assistant should prepare information for submission into the existing quotation workflow.

Persistent AI conversation storage is optional and should only be introduced when justified.

## 9. Administrator Control Centre

Extend the existing admin dashboard.

Potential additions:

- AI-assisted quotation submissions
- Project brief review
- Pending quotation approvals
- Client acceptance status
- Payment status
- Pending project kickoff approvals
- Milestone approval requests
- Delivery approval requests

Do not build a separate administration application.

## 10. Client Portal Improvements

Extend the existing client dashboard.

Potential additions:

- Quotation history
- Quotation acceptance
- Payment instructions and status
- Project timelines
- Milestone approvals
- Project documents
- Deliverable reviews
- Notifications
- AI project assistance

Preserve existing authentication and client-specific data access restrictions.

## 11. Homepage Direction

The homepage should communicate the complete client journey.

Proposed positioning:

Headline:
Turn Your Business Idea Into a Digital Solution.

Supporting message:
From professional business websites to custom applications and automated business systems, UniHost Technologies helps you plan, build and launch digital solutions.

Primary action:
Start Your Project

Secondary action:
Explore Our Solutions

Proposed workflow sections:

1. Tell us your idea.
2. Discover the right solution.
3. Review your project proposal.
4. Approve and get started.
5. Track your project.
6. Launch with confidence.

Do not advertise AI capabilities as operational until the feature is implemented and tested.

## 12. Implementation Phases

### Phase 1: Architecture and documentation

Status: IN PROGRESS

- Establish project development rules.
- Document approved technology stack.
- Document existing application structure.
- Document unified client workflow.
- Avoid duplicate architecture.

### Phase 2: Existing workflow alignment

Status: IN PROGRESS

- Review quotation status transitions.
- Review quotation approval actions.
- Review client acceptance handling.
- Review project conversion.
- Review milestone approval handling.
- Identify minimal database changes.


Progress already made:
- Nairobi timezone-aware quotation expiry.
- Restrictions on accepting or requesting revisions for expired quotations.
- Reset of previous client responses when a revised quotation is issued.
- Protection against duplicate client-project conversion.
- Server-side protection of quotation status transitions.
- Restricted client access-link issuance and resend operations.
- Persistent administrator login rate limiting.

Remaining work:
- Complete regression testing of quotation and acceptance workflows.
- Verify project conversion and client access-link recovery.
- Review milestone approval handling.
- Confirm that database changes remain minimal and consistent with the live schema.

Do not mark this phase complete until the affected workflows have passed regression testing.
### Phase 3: AI Project Guide

Status: PLANNED

- Design guided discovery.
- Implement server-side AI integration.
- Enforce approved technology recommendations.
- Prepare structured project briefs.
- Connect submissions to existing quotation workflow.

### Phase 4: Administrative approvals

Status: PLANNED

- Centralize pending approvals in existing admin dashboard.
- Enforce server-side authorization.
- Record approval decisions.
- Notify relevant users.

### Phase 5: M-Pesa payment integration

Status: PLANNED

- Integrate Safaricom Daraja API.
- Implement secure payment initiation.
- Verify payment callbacks server-side.
- Store transaction references and payment records.
- Prevent duplicate transaction processing.
- Track pending, successful and failed payments.
- Reconcile payment status with the executed contract.
- Enforce required payment conditions before project activation.

### Phase 6: Project automation

Status: PLANNED

- Automate approved project creation.
- Extend milestone workflows.
- Introduce client milestone approvals.
- Improve project notifications.

### Phase 7: Homepage and user experience

Status: PLANNED

- Refine homepage messaging.
- Explain the end-to-end client journey.
- Introduce AI assistant entry point when operational.
- Improve calls to action.
- Maintain existing design identity.

### Phase 8: Production readiness

Status: PLANNED

- Security review
- Regression testing
- Accessibility review
- Performance checks
- Deployment verification
- Operational documentation

## 13. Development Rules

- Inspect before modifying.
- Read installed Next.js documentation before relevant code changes.
- Preserve working features.
- Prefer existing components and database structures.
- Avoid unnecessary dependencies.
- Avoid duplicate functionality.
- Keep business calculations deterministic.
- Enforce authorization on the server.
- Protect client data.
- Test affected workflows after changes.
- Never claim untested functionality is complete.

## 14. Status Definitions

COMPLETED:
Implemented and confirmed working.

IN PROGRESS:
Currently being developed.

PLANNED:
Approved future work.

NEEDS VERIFICATION:
Implementation exists but has not been independently verified.

BLOCKED:
Cannot proceed because of an unresolved dependency.

The project owner has confirmed that the existing core features have been tested. Do not reopen previously resolved issues without new evidence.

## 15. Guiding Principle

Build one integrated UniHost platform.

Automate repetitive work.
Keep business rules deterministic.
Require administrator approval for consequential decisions.
Keep clients informed.
Protect existing functionality.
Prefer simple, maintainable architecture over unnecessary complexity.

## 16. Contract Management and Client Acceptance

**Status: IN PROGRESS — schema reconciliation and application foundation.**

Repository/live-environment audit on 27 November 2026 found that the live Supabase project already had empty `contracts`, `contract_versions`, `contract_signatures` and `contract_events` tables with client-scoped SELECT policies and append-only signature/event protections. These objects were not represented in the tracked migration history or Prisma schema. Three migrations now bring the foundation under source control:

- `20261127064722_contract_management_foundation.sql` — baseline tables, constraints, indexes, append-only protections and client read policies.
- `20261127065621_create_contract_draft_from_accepted_quote.sql` — service-role-only, atomic contract/version/audit creation from an accepted quotation linked to a draft client project.
- `20261127070518_hide_internal_contract_drafts_from_clients.sql` — hides internal drafts and their versions/signatures from clients until explicitly advanced into client review.

The draft RPC verifies accepted quotation state, quote/project/client email identity, positive approved price and supported currency; rejects legacy active projects; and returns an existing draft on retry. Client SELECT policies expose only non-draft contracts, versions/signatures for non-draft contracts, and explicitly client-visible events. The RPC is executable by `service_role` only.

Rollback-only tests verified successful draft/version/audit creation, idempotent retry, unchanged project status and rejection of a legacy active project. All test rows were rolled back; the four contract tables remain empty. Prisma validation/client generation, TypeScript and ESLint passed (four existing warnings remain in sample Supabase Edge Functions). The isolated Next.js production build and Vercel Preview deployment both completed successfully. Prisma schema-only commands no longer require a branch-scoped `DIRECT_URL`; real database/migration operations still require the secret. No contract has been sent or signed, no payment integration exists, and no project was activated.

### Objective

Introduce a dedicated contract management workflow that formalises the agreement between UniHost Technologies and its clients before project implementation begins.

The contract process must follow recognised international commercial contracting principles while accommodating the applicable laws of the governing jurisdiction. Contract templates and electronic-signature procedures must receive appropriate legal review before production use.

### 16.1 Contract Generation

The system must generate a formal service agreement from the approved quotation and verified client information.

The contract must support:

- Full legal names and contact details of both parties.
- Contract reference number and effective date.
- Project description, scope of work and specifications.
- Deliverables, exclusions and acceptance criteria.
- Project milestones and delivery timelines.
- Contract price, payment schedule, deposits, taxes and applicable charges.
- Client responsibilities and service provider responsibilities.
- Change requests, variations and additional work.
- Revision limits and approval procedures.
- Intellectual property ownership and licensing.
- Confidentiality and data protection obligations.
- Warranties, maintenance and post-delivery support.
- Dependencies, delays and force majeure.
- Breach, suspension and termination provisions.
- Dispute resolution, governing law and jurisdiction.
- Signature blocks and supporting schedules.

### 16.2 Contract Review and Approval

The system must support:

- Draft contract generation.
- Internal administrative review.
- Contract revisions and version tracking.
- Client review and clarification requests.
- Recording agreed amendments.
- Final contract approval.

Only the approved final version may proceed to signing.

### 16.3 Electronic Signing and Execution

The platform must support legally appropriate electronic signing.

Required capabilities:

- Secure access to the final contract.
- Signatory identification and authentication.
- Electronic signature capture.
- Explicit confirmation of intent to sign.
- Date and time stamps.
- Appropriate signing audit information.
- Client signature.
- UniHost Technologies countersignature.
- Secure storage of the executed contract.
- Downloadable copies for both parties.
- Evidence that identifies the exact contract version signed.

A signed contract must remain immutable. Changes after execution must be handled through a formal amendment or a newly executed contract version.

Electronic-signature implementation must be assessed against applicable electronic transaction, privacy and evidence laws.

### 16.4 Contract Activation

Quotation acceptance and contract execution are separate events.

Project implementation must not automatically begin simply because a client accepts a quotation.

Contract activation must require:

1. An approved quotation.
2. A generated and internally approved contract.
3. Client signature.
4. UniHost Technologies countersignature.
5. Confirmation of any required initial payment or deposit.
6. Confirmation that the contract is effective.

The system must record the contract status, effective date, parties and associated project.

Any authorised exception must be documented and approved.

### 16.5 Project Implementation and Milestone Acceptance

Implementation must be linked to the executed contract.

Each contractual milestone must have:

- Defined deliverables.
- Measurable acceptance criteria.
- Submission date.
- Client review and testing process.
- Acceptance or rejection option.
- Feedback and correction records.
- Resubmission capability.
- Formal acceptance confirmation.
- Timestamped approval evidence.

A milestone must not be marked as accepted without recorded client acceptance or another expressly agreed contractual acceptance mechanism that is legally valid.

### 16.6 Final Project Acceptance

At project completion, the platform must generate a Project Completion and Acceptance Certificate.

The certificate must record:

- Project reference.
- Contract reference.
- Final deliverables.
- Completion date.
- Outstanding issues or agreed exceptions.
- Client confirmation of receipt and acceptance.
- Any remaining contractual obligations.
- Client and service provider approval records.

Final project closure must follow the acceptance and outstanding-obligation requirements defined in the contract.

### 16.7 Contract Records and Audit Trail

The platform must maintain secure, access-controlled records of:

- Original approved quotation.
- Contract drafts and revisions.
- Final executed contract.
- Signature evidence and timestamps.
- Contract amendments.
- Payment records.
- Milestone submissions and approvals.
- Client rejections and correction history.
- Final acceptance certificate.
- Relevant supporting communications and documents.

Significant actions must be traceable. Retention, privacy and access policies must comply with applicable legal requirements.

### 16.8 Contract Lifecycle Statuses

The contract module should support the following statuses:

- DRAFT
- INTERNAL_REVIEW
- PENDING_CLIENT_REVIEW
- REVISION_REQUESTED
- APPROVED_FOR_SIGNING
- PENDING_CLIENT_SIGNATURE
- PENDING_PROVIDER_SIGNATURE
- EXECUTED
- ACTIVE
- SUSPENDED
- COMPLETED
- TERMINATED
- EXPIRED

Status transitions must be validated server-side and restricted according to the user's role and the contract's current state.

### 16.9 Required Workflow

The complete commercial and delivery lifecycle must be:

Client Request -> Quotation -> Client Quotation Acceptance -> Contract Generation -> Contract Review -> Client Signature -> UniHost Countersignature -> Payment Confirmation Where Required -> Contract Activation -> Project Implementation -> Milestone Submission -> Client Milestone Acceptance -> Final Acceptance Certificate -> Project Closure.

Quotation acceptance, contract execution, milestone acceptance and final project acceptance must remain separate recorded events.

### 16.10 Completion Criteria

This milestone is complete only when:

- Contract generation from approved quotations works.
- Contract review and version control work.
- Both parties can execute the contract through the approved signing mechanism.
- Signed documents and evidence are securely retained.
- Project activation is controlled by contract execution requirements.
- Milestone submissions and client acceptance are recorded.
- Final project acceptance certificates can be generated.
- Access controls and audit trails have been tested.
- Contract templates and signing procedures have received the required legal review.

## 17. Git, Verification and Release Milestones

Git is the project's version-control and delivery record. Changes must be reviewed and validated before they are committed or pushed.

### Milestone 1: Documentation baseline

- Maintain PROJECT_ROADMAP.md as the master product roadmap.
- Maintain AGENTS.md as the practical development instruction file.
- Record implementation status honestly.
- Preserve historical backups and unrelated working-tree changes.

### Milestone 2: Implementation review

- Inspect the working tree before modifying or staging files.
- Review each implementation change and its purpose.
- Check database migrations against the intended live schema.
- Exclude secrets, local environment files, temporary credentials and unapproved backup files.

### Milestone 3: Validation

- Run targeted lint checks for changed code.
- Run TypeScript validation.
- Run the production build when applicable.
- Run relevant workflow and security regression tests.
- Review git diff and git diff --check.
- Resolve blocking validation failures before committing.

### Milestone 4: Git commit

- Commit logically related, reviewed changes in clearly named commits.
- Keep documentation, security safeguards and workflow changes distinguishable where practical.
- Use descriptive commit messages.
- Never commit unreviewed files or unrelated changes.
- Do not rewrite shared history or force-push as a routine operation.

### Milestone 5: Git push

- Confirm the target branch and remote before pushing.
- Push the reviewed branch to its configured remote.
- Verify that the remote branch contains the expected commits.
- Do not push secrets, local-only configuration or backup archives.

### Milestone 6: Deployment verification

- Deploy only through the approved deployment workflow.
- Verify the deployed build and critical application routes.
- Check authentication, quotation submission, client responses, contract execution and project acceptance workflows.
- Record deployment failures and unresolved issues.
- Do not describe a deployment as successful until it has been verified.

A Git commit records a reviewed change; a push publishes that commit to the remote repository; neither alone proves that production deployment is successful.
