# UI Flow — Support Ticket Management System

> **Purpose:** Document the frontend screens, navigation paths, and primary user journeys as implemented in the React app.
>
> **Scope authority:** [acceptance-criteria.md](acceptance-criteria.md) governs feature scope. Backend rules in [requirement-analysis.md](requirement-analysis.md) remain the source of truth; the UI may hint at valid next statuses but does not solely enforce them.

---

## 1. Application Shell

| Element | Behavior |
|---------|----------|
| Header | App title: **Support Ticket Management** |
| Nav | `Tickets` → `/tickets`, `Home` → `/home` |
| Default route | `/` redirects to `/tickets` |

```text
┌──────────────────────────────────────────────────────────┐
│  Support Ticket Management     [Tickets]  [Home]         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                     <page content>                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Screens and Routes

| Route | Screen | Purpose |
|-------|--------|---------|
| `/` | Redirect | Navigates to ticket list |
| `/tickets` | Ticket list | Browse, search, filter, create tickets |
| `/tickets/:id` | Ticket detail | View, edit, assign, change status, comment |
| `/home` | Home / health | Welcome placeholder and API health status |

### Screen map

```mermaid
flowchart LR
  Root["/"] -->|redirect| List["/tickets<br/>Ticket List"]
  List -->|Create Ticket| Modal["Create Ticket Modal"]
  Modal -->|success| List
  List -->|row / title click| Detail["/tickets/:id<br/>Ticket Detail"]
  Detail -->|Tickets breadcrumb| List
  Detail -->|Edit Ticket| Edit["Detail — Edit Mode"]
  Edit -->|Save / Cancel| Detail
  NavHome["Nav: Home"] --> Home["/home<br/>Health"]
  NavTickets["Nav: Tickets"] --> List
```

---

## 3. Primary User Journeys

### 3.1 Browse tickets

```mermaid
flowchart TD
  A[Open /tickets] --> B{Load tickets}
  B -->|loading| C[Show loading message]
  B -->|error| D[Show error banner]
  B -->|empty, no filters| E[No tickets yet]
  B -->|empty, with filters| F[No tickets match your filters]
  B -->|success| G[Show ticket table]
  G --> H[Click row or title]
  H --> I[Navigate to /tickets/:id]
```

**List columns:** Title, Priority, Status, Assignee, Created, Updated.

### 3.2 Search and filter

```mermaid
flowchart TD
  A[Ticket list] --> B[Enter search keyword]
  A --> C[Select status filter]
  B --> D[Submit Search]
  C --> E[Apply status immediately]
  D --> F[Update URL query params]
  E --> F
  F --> G["GET /api/tickets?search=&status="]
  G --> H[Refresh table]
  H --> I{Has active filters?}
  I -->|yes| J[Show Clear filters]
  J --> K[Clear → reset URL and reload all]
```

| Control | Behavior |
|---------|----------|
| Search | Keyword on title/description; applied on form submit |
| Status | Dropdown (`All statuses` or a specific status); applied on change |
| Clear filters | Visible when search or status is active; resets both |
| URL state | Filters stored in `?search=` and `?status=` for shareable list views |

Search and status filters combine with **AND** logic on the backend.

### 3.3 Create ticket

```mermaid
flowchart TD
  A[Ticket list] --> B[Click Create Ticket]
  B --> C[Open Create Ticket modal]
  C --> D[Fill title, description, priority]
  D --> E[Submit]
  E --> F{Client validation}
  F -->|fail| G[Show field errors]
  G --> D
  F -->|pass| H["POST /api/tickets"]
  H -->|400| I[Map API details to fields / banner]
  I --> D
  H -->|network / 500| J[Show form error banner]
  J --> D
  H -->|201| K[Close modal]
  K --> L[Prepend ticket to list]
```

| Field | Notes |
|-------|-------|
| Title | Required |
| Description | Required |
| Priority | Required (`Low`, `Medium`, `High`, `Critical`) |
| Status | Not set by user — server creates ticket as **Open** |

Modal dismiss: Cancel, close (×), Escape, or backdrop click (blocked while submitting).

### 3.4 View ticket detail

```mermaid
flowchart TD
  A["Open /tickets/:id"] --> B["Parallel load: ticket, comments, users"]
  B -->|ticket 404| C[Ticket not found + link back]
  B -->|ticket error| D[Generic load error + link back]
  B -->|success| E[View mode layout]
  E --> F[Main: title, description, comments]
  E --> G[Sidebar: status, assignee, priority, metadata]
```

**View-mode sidebar actions (immediate save):**

- Change **Status** → `PATCH /api/tickets/:id` with `{ status }`
- Change **Assignee** → `PATCH /api/tickets/:id` with `{ assignedTo }` (`null` = Unassigned)

Invalid status transitions show an inline error under the status control (backend message).

### 3.5 Edit ticket fields

```mermaid
flowchart TD
  A[Detail view mode] --> B[Click Edit Ticket]
  B --> C[Enter edit mode]
  C --> D[Edit title, description, priority, status, assignee]
  D --> E{Save Changes}
  E --> F{Client validation}
  F -->|fail| G[Field errors]
  G --> D
  F -->|pass| H["PATCH /api/tickets/:id"]
  H -->|400| I[Field / status / banner errors]
  I --> D
  H -->|success| J[Exit edit mode / show updated ticket]
  D --> K[Cancel]
  K --> J
```

Edit mode keeps the same two-column layout. Status options that are not the current status or an allowed next status are **disabled** as a UX hint; the backend still validates every transition.

### 3.6 Add comment

```mermaid
flowchart TD
  A[Detail view mode] --> B[Enter comment message]
  B --> C[Post Comment]
  C --> D{Client validation}
  D -->|empty / too long| E[Field error]
  E --> B
  D -->|pass| F["POST /api/tickets/:id/comments"]
  F -->|400| G[Field / banner error]
  G --> B
  F -->|201| H[Append comment to chronological list]
  H --> I[Clear textarea]
```

Comments display oldest-first with author name and timestamp. Comment load failures are shown separately from ticket load failures.

### 3.7 Check API health (optional)

```mermaid
flowchart TD
  A[Nav → Home] --> B["GET /api/health"]
  B -->|loading| C[Checking backend health...]
  B -->|ok| D[Backend status: ok]
  B -->|fail| E[Backend unavailable message]
```

---

## 4. Status Workflow (UI Behavior)

Valid transitions (backend authority):

```text
Open        → In Progress | Cancelled
In Progress → Resolved | Cancelled
Resolved    → Closed
Closed      → (none — terminal)
Cancelled   → (none — terminal)
```

| UI behavior | Detail |
|-------------|--------|
| Hint | Status dropdown enables only current + allowed next statuses |
| Immediate change | View mode updates status on select |
| Edit mode | Status can change as part of Save Changes |
| Rejection | Backend `400` message shown under the status control or in the edit form |

Field updates (title, description, priority, assignee) remain allowed on **Closed** / **Cancelled** tickets; only further status changes are blocked.

---

## 5. Error and Empty States

| Scenario | Where shown | User action |
|----------|-------------|-------------|
| List load failure | Banner on ticket list | Retry by reloading / changing filters |
| No tickets | Empty state on list | Create a ticket |
| No filter matches | Empty state on list | Clear filters or adjust search |
| Ticket not found | Detail page | Back to tickets |
| Validation (create/edit/comment) | Field errors + optional banner | Correct fields and resubmit |
| Invalid status transition | Status field / form error | Choose an allowed next status |
| Assignee / users load failure | Assignee control error | Retry by reopening edit or reloading |
| Comments load failure | Comments section error | Ticket details still usable |
| Network / 500 | Form or page banner | Retry; no internal stack traces shown |

---

## 6. End-to-End Happy Path

```mermaid
sequenceDiagram
    actor User
    participant List as Ticket List
    participant Modal as Create Modal
    participant Detail as Ticket Detail
    participant API as Backend API

    User->>List: Open /tickets
    List->>API: GET /api/tickets
    API-->>List: Ticket collection
    User->>Modal: Create Ticket
    User->>Modal: Submit title, description, priority
    Modal->>API: POST /api/tickets
    API-->>Modal: 201 Open ticket
    Modal-->>List: Prepend new ticket
    User->>Detail: Open ticket
    Detail->>API: GET ticket, comments, users
    API-->>Detail: Detail payload
    User->>Detail: Change status / assignee
    Detail->>API: PATCH /api/tickets/:id
    API-->>Detail: Updated ticket
    User->>Detail: Edit fields and Save
    Detail->>API: PATCH /api/tickets/:id
    API-->>Detail: Updated ticket
    User->>Detail: Post comment
    Detail->>API: POST /api/tickets/:id/comments
    API-->>Detail: 201 comment
    User->>List: Breadcrumb / nav back
    User->>List: Search + status filter
    List->>API: GET /api/tickets?search&status
    API-->>List: Filtered results
```

---

## 7. Out of Scope (UI)

The following are not part of the current UI flow:

- Authentication / login
- User management screens
- Ticket or comment deletion
- Comment editing
- Pagination controls
- Assignment history or audit views

---

*Aligned with the implemented frontend (`frontend/src/App.jsx`, pages, and `CreateTicketModal`). Update this document when navigation or screen behavior changes.*
