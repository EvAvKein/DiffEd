# DiffEd: Contributions

## Table of Contents

- [Team Information](#team-information)
- [Project Management](#project-management)
- [Features List](#features-list)
- [Modules](#modules)
- [Individual Contributions](#individual-contributions)

## Team Information

| Member                                     | Role(s)                        | Responsibilities                                                                                                                    |
| ------------------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| [Eve Keinan](https://github.com/EvAvKein)  | Technical Lead / Architect     | Defines architecture and tech stack decisions. Ensures code quality and best practices. Reviews critical changes.                   |
| [Jukka Aho](https://github.com/EyzeCOLD)   | Project Manager / Scrum Master | Facilitates team coordination. Organizes meetings and planning sessions. Tracks progress and deadlines. Manages risks and blockers. |
| [Jyri Piensalo](https://github.com/Sky11y) | Product Owner                  | Defines product vision and prioritizes features. Maintains the product backlog. Validates completed work.                           |
| [Luka Taalas](https://github.com/Omppu0)   | Developer                      | Contributes to implementation of modules. Participates in code reviews. Thoroughly tests team's implementations.                    |

**All team members regularly contributed to the development responsibilities**

## Project Management

**Work organization**

The team works in 2-week sprints, aiming towards code-named release-based version milestones (e.g. Cherry, Pineapple, Cactus). Each version added a defined scope of features agreed on upfront, and the team checks in regularly (remotely and in person) to track progress and resolve blockers. On a day-to-day basis, issues are created on a kanban board and team members pick up tasks from the backlog, moving them across the board as they progress until a PR is opened for review and merge.

**Tools**

- **GitHub Projects**: Issue tracking and feature backlog.
- **GitHub Pull Requests**: All changes go through PRs with a mandatory review by at least one peer. PRs are open to change requests if needed before merge.
- **Discord**: Main communication channel for async discussion and coordination.

## Features List

| Feature                  | Description                                                                                                                                           | Contributor(s)         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Real-time collaboration  | Live text editing in multi-user, multi-file sessions - synchronized through Operational Transformation over WebSockets                                | Eve                    |
| Rich editing features    | Syntax highlighting for 17 languages, Vim keybindings, and unified diff views for comparing with peer files (with chunk-based changes Accept buttons) | Eve                    |
| File management          | Create, upload, download, rename, and delete personal files                                                                                           | Luka, Jukka, Eve       |
| File browser             | Paginated file list with name sorting and search filtering                                                                                            | Jukka                  |
| GitHub OAuth             | GitHub OAuth authentication for sign up and login, with GitHub-auth linking and unlinking                                                             | Eve                    |
| User accounts            | Email/username + password sign-up and login, with Argon2id password hashing                                                                           | Jyri                   |
| User avatars             | Upload, replace, and delete a profile avatar, with a default fallback                                                                                 | Jyri                   |
| Session persistence      | Server-side sessions stored in PostgreSQL - users stay logged in across refreshes                                                                     | Jyri                   |
| Accessibility Compliance | WCAG 2.1 AA compliance: Keyboard navigation, high color contrast, labeled controls, screen reader live regions                                        | Eve, Jukka             |
| Account settings         | Manage username, email, password, API keys, GitHub link, Vim preference, and account deletion                                                         | Jyri, Jukka, Eve       |
| Public REST API          | Public endpoints for accounts, files, and workspaces, with API-key authenticated access                                                               | Jyri, Luka, Jukka, Eve |
| API documentation        | In-app reference page documenting the public API endpoints                                                                                            | Jyri, Eve              |
| Toast notifications      | Feedback for user actions via success, error, and info messages                                                                                       | Eve                    |
| Containerized deployment | Docker Compose orchestration of a frontend, backend, database, and Nginx reverse proxy                                                                | Eve                    |

## Modules

This project implements **15 points** worth of modules. **Major** modules are worth 2 points each, and **Minor** modules 1 point each.

| Tier      | Count  | Points |
| --------- | ------ | ------ |
| Major     | 4      | 8      |
| Minor     | 7      | 7      |
| **Total** | **11** | **15** |

### Major modules

**Both frontend and backend frameworks** - 2 pts

- _Justification:_ A frontend framework helps in building browser applications, through abstracting away complex state management and rendering updates. A backend framework helps by abstracting away core routing setup and session management.
- _Implementation:_ React bundled by Vite on the frontend, Express on Node.js for the backend, both written completely in TypeScript with a shared types package to ensure consistency throughout the codebase.
- _Contributors:_ Eve

**Real-time features with WebSockets** - 2 pts

- _Justification:_ Sockets are essential for real-time collaborative editing, allowing low-latency, bidirectional communication between clients and the server to synchronize edits across users.
- _Implementation:_ Socket.IO connections link editor clients to the backend, which serves as the central authority for collaboration. File edits are transmitted and reconciled with Operational Transformation actions.
- _Contributors:_ Eve

**WCAG accessibility compliance** - 2 pts

- _Justification:_ Accessibility is a core requirement for any user-facing application, and WCAG 2.1 AA is a widely recognized standard that ensures the app is usable by people with a wide range of disabilities.
- _Implementation:_ The UI targets WCAG 2.1 AA: Semantic HTML, high-contrast text and icons, labeled inputs, keyboard navigation, and `aria-live` regions for dynamic updates.
- _Contributors:_ Eve, Jukka

**Public API** - 2 pts

- _Justification:_ A public API allows clients to interact with the application's core features programmatically, enabling integrations, automation, and third-party tool development that can enhance the app's user experience.
- _Implementation:_ Users generate a personal API key in their account settings: The key authenticates requests to the account, file, and workspace endpoints, which are described on an in-app documentation page.
- _Contributors:_ Jyri, Luka, Jukka, Eve

### Minor modules

**Real-time collaboration (workspaces, live editing)** - 1 pt

- _Justification:_ Real-time collaborative editing is a fundamental feature of the app, and shared workspaces allow multiple users to collaborate simultaneously.
- _Implementation:_ Collaborators join a shared workspace with their chosen file, and can view a live unified diff against the file of any peer. Peer edits stream in with no refresh required.
- _Contributors:_ Eve

**Complete notification system** - 1 pt

- _Justification:_ User feedback is essential for a good user experience, and a global toast system provides a channel for messages that inform users about the success, failure, or status of their actions across the app without cluttering the interfaces with in-page notifications.
- _Implementation:_ A global toast store manages and handles the IO of success, error, and info messages across the app. Toasts are displayed in a corner of the core layout, for a duration adjusted according to the message length.
- _Contributors:_ Eve

**Advanced search** - 1 pt

- _Justification:_ The users have the ability to upload hundreds of files, so it is imperative that they can be easily filtered through.
- _Implementation:_ The files are shown paginated, 10 files per page. The filter input lets the user search the files. The files are sorted by name alphabetically and the user can toggle the sorting to be ascending or descending. All this happens on the frontend.
- _Contributors:_ Jukka

**File upload & management** - 1 pt

- _Justification:_ File uploads allow the users to easily import, edit and export their own files with the app and to set a user avatar to express themselves.
- _Implementation:_ The file browser allows the user to upload files from their disk, create new files, download and delete them from their account. In the account settings you can upload an image as your avatar or delete an existing avatar to return to the default image.
- _Contributors:_ Luka, Jukka, Jyri

**Support for two additional browsers** - 1 pt

- _Justification:_ Supporting multiple browsers ensures a wider user base can access the app and use it as intended.
- _Implementation:_ The app is tested and styled to work across Chromium browsers and Firefox, with team members defaulting to different browsers during development.
- _Contributors:_ Jyri, Luka, Jukka, Eve

**Remote authentication (GitHub)** - 1 pt

- _Justification:_ Remote authentication via a trusted third party like GitHub provides users with a convenient and secure way to sign up and log in without creating yet another password, while allowing them to link their GitHub account for potential future integrations.
- _Implementation:_ GitHub OAuth via Passport.js lets users sign up, log in, and link/unlink a GitHub account.
- _Contributors:_ Eve

**Custom design system** - 1 pt

- _Justification:_ A design system ensures a consistent look and feel across the app, improves development speed by providing reusable components, and allows for easier maintenance of the UI.
- _Implementation:_ A folder with reusable UI components, color palette declared in root CSS file and used throughout, different fonts and visual hierarchy through font sizes, and icon images for buttons.
- _Contributors:_ Jukka, Eve, Jyri

## Individual Contributions

### Eve Keinan ([EvAvKein](https://github.com/EvAvKein))

**Contributions**

- Project skeleton and architecture - containerized fullstack scaffolding, the TypeScript frontend/backend/shared monorepo, and absolute-path imports
- Real-time collaborative editing - the Operational Transformation engine synchronizing edits over Socket.IO, with the backend as the central authority
- Workspaces - shared multi-user collaboration sessions, with member slots, disconnect grace periods, and edit streaming and persistence
- Unified diff view - live per-peer diff comparison with per-chunk Accept buttons
- Multi-language syntax highlighting - CodeMirror language extensions with overrideable language detection by file extension
- Vim keybindings - toggleable Vim mode in the editor and settings, with a custom Escape key handler to support tab insertions without breaking tab navigation
- GitHub OAuth - PassportJS sign-up, login, and account linking/unlinking
- Frontend session handling - a user store, auto-login, and session-aware routing
- Toast notifications - the global toast store for user action feedback, with screen reader support and dynamic duration based on message length
- Public API authentication - API-key auth middleware wired into the account, file, and workspace endpoints, plus API documentation page
- Accessibility - high color contrast, skip-to-content, labeled icon buttons, screen reader live regions and ARIA tags, and system-color editor selections
- Project tooling - dependency audit scripts, the wiki-clone script, centralized env loading, and the README

**Modules:** Both frontend and backend frameworks, Real-time features with WebSockets, WCAG accessibility compliance, Real-time collaboration, Complete notification system, Remote authentication. Contributed to the Public API, and Support for two additional browsers.

**Challenges faced:**

- Getting all syntax-highlighted text to have accessible color contrast with selection-highlighting overlay.
- Collaboration (non-OT) state-updates and their edge-cases.

### Jyri Piensalo ([Sky11y](https://github.com/Sky11y))

**Contributions**

- User accounts - the email/username sign-up and login, with Argon2id password hashing
- Account settings - the user-management page for changing username, email, and password, plus account deletion
- User avatars - uploading, replacing, and deleting a profile avatar, with a default fallback
- Public API - the public account endpoints and the `requireAuthOrApiKey` authentication middleware
- API keys - personal API key generation, copying, and deletion
- Session backend - server-side session management and persistence
- Database query separation - extracting database queries into dedicated query-service modules
- API documentation - drafted core structure of the API reference page

**Modules:** Both frontend and backend frameworks, Public API. Contributed to Support for two additional browsers and File upload & management.

**Challenges faced:**

- Making passport.js to work. Eventually Eve made this work for OAuth.
- Struggling with Typescript.

### Jukka Aho ([EyzeCOLD](https://github.com/EyzeCOLD))

**Contributions**

- File browser - the file list layout, pagination, name sorting, and search filtering
- Frontend file validation - file type and size checks, and filename collision detection
- Download button - the file download control
- Endpoint refactoring - standardizing the user-management and general API endpoints, including database errors helper
- Accessibility - contrast fixes, screen reader compatibility improvements, and keyboard-navigation fixes
- Shared components - reusable Input, Button, ResettingForm, and DeleteButton components
- Account settings - contributed to the user-management page styling and inputs
- Pre-push githook - the repository's pre-push git hook
- Github - set up the repository, branch rule sets and project boards
- Project conventions - established with the rest of the team conventions for working as a group, including coding style and how to conduct PR reviews

**Modules:** Both frontend and backend frameworks, Advanced search, the public API. contributed to WCAG accessibility compliance, File upload & management, Custom design system, and Support for two additional browsers.

**Challenges faced:**

- Typescript and React, namely understanding how the hooks works, when the components run
- Learning about screen readers and aria tags
- Getting the big picture of a stack of different technologies

### Luka Taalas ([Omppu0](https://github.com/Omppu0))

**Contributions**

- Backend file management - the file upload, retrieval, and delete endpoints, file query service
- Backend and frontend file validation - file-type and size validation on uploads
- Multi-call uploads - handling file uploads as multiple independent requests
- Upload UX - file uploading frontend functionality, error handling on failed uploads etc...
- File list optimization - trimming the file endpoints, making the backend only return the necessary data
- Nginx custom return types - return api compliant json on request size and rate limiting
- Public API - contributed to the public file endpoints
- Project architecture - Brainstorming and refining architectural and implementation details with the team

**Modules:** Both frontend and backend frameworks, File upload & management, the Public API. Contributed to support for two additional browsers.

**Challenges faced:**

- Waiting for long and seemingly fragile builds
- Typescript and React unintuitive behaviours
- Getting more comfortable with non linear program flow caused by async hooks and timers
- Having to accept and work with complexity that feels unnecessary

_All team members also contributed to code reviews and to development responsibilities across the codebase._
