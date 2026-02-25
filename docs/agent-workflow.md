# Agent Workflow Document

## 1. Team Structure

```
            ┌─────────────┐
            │  Team Lead  │
            └──────┬──────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│  Game     │ │ Frontend  │ │   Game    │
│ Designer  │ │   Dev     │ │ Logic Dev │
└───────────┘ └───────────┘ └───────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│   Asset   │ │  Tester   │ │   Team    │
│  Creator  │ │           │ │   Lead    │
└───────────┘ └───────────┘ └───────────┘
```

## 2. Communication Protocol

### 2.1 Message Types

#### Status Updates
```
Type: message
Recipient: team-lead
Content: Progress update on task #X
```

#### Task Requests
```
Type: message
Recipient: [specific agent]
Content: Request for deliverable
```

#### Broadcast Announcements
```
Type: broadcast
Content: Critical information for all team members
```

### 2.2 Communication Flow

1. Team Lead assigns task → Agent receives notification
2. Agent works on task → Sends progress updates
3. Agent completes task → Marks as completed
4. Team Lead reviews → Provides feedback or approves

## 3. Development Phases

### Phase 1: Design (Sequential)

```
┌─────────────────────────────────────────────┐
│  Game Designer: Create GDD                  │
│         │                                   │
│         ▼                                   │
│  Team Lead: Review GDD                      │
│         │                                   │
│         ▼                                   │
│  Game Designer: Revise based on feedback    │
│         │                                   │
│         ▼                                   │
│  Team Lead: Approve GDD                     │
└─────────────────────────────────────────────┘
```

### Phase 2: Foundation (Parallel)

```
         ┌───────────────────┐
         │   Team Lead       │
         │   Create Tasks    │
         └─────────┬─────────┘
                   │
     ┌─────────────┼─────────────┐
     │             │             │
     ▼             ▼             ▼
┌─────────┐  ┌──────────┐  ┌───────────┐
│Frontend │  │  Logic   │  │   Asset   │
│   Dev   │  │   Dev    │  │  Creator  │
│ Engine  │  │   ECS    │  │  Assets   │
└─────────┘  └──────────┘  └───────────┘
     │             │             │
     └─────────────┼─────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │   Integration   │
         │   by Team Lead  │
         └─────────────────┘
```

### Phase 3: Core Features (Parallel)

```
Tasks in parallel:
├── Frontend Dev: UI System + Scene Management
├── Logic Dev: Physics + Collision Detection
├── Asset Creator: Level Data + Game Assets
└── Tester: Write Test Cases
```

### Phase 4: Game Features (Iterative)

```
For each feature:
1. Game Designer: Define feature spec
2. Team Lead: Create tasks
3. Developers: Implement in parallel
4. Tester: Test implementation
5. Team Lead: Review and integrate
```

### Phase 5: Polish (Sequential + Parallel)

```
Sequential:
├── Tester: Full regression test
├── All Devs: Bug fixes (parallel)
└── Team Lead: Release preparation

Parallel during bug fixes:
├── Frontend Dev: UI polish
├── Logic Dev: Performance optimization
└── Asset Creator: Final asset polish
```

## 4. Task Assignment Guidelines

### 4.1 Task Dependencies

```json
{
  "task1": {
    "depends_on": [],
    "blocks": ["task2", "task3"]
  },
  "task2": {
    "depends_on": ["task1"],
    "blocks": ["task4"]
  }
}
```

### 4.2 Assignment Matrix

| Task Type | Primary Owner | Collaborators |
|-----------|--------------|---------------|
| GDD Creation | Game Designer | Team Lead (review) |
| Engine Code | Frontend Dev | Logic Dev |
| Game Logic | Logic Dev | Frontend Dev |
| Assets | Asset Creator | Game Designer |
| Tests | Tester | All Devs |
| Integration | Team Lead | All |

## 5. File Ownership

### 5.1 Primary Ownership

| Directory/File | Primary Owner |
|----------------|---------------|
| docs/game-design-document.md | Game Designer |
| src/core/ | Frontend Dev |
| src/entities/ | Logic Dev |
| src/components/ | Logic Dev |
| src/systems/ | Logic Dev |
| src/ui/ | Frontend Dev |
| src/assets/ | Asset Creator |
| tests/ | Tester |

### 5.2 Collaboration Rules

- Before modifying another owner's files, send a message
- Major changes require Team Lead approval
- Use feature branches for significant changes

## 6. Definition of Done

A task is complete when:

1. [ ] Code implements all requirements
2. [ ] Code passes linting (ESLint)
3. [ ] Code passes type checking (TypeScript)
4. [ ] Unit tests pass (Jest)
5. [ ] Code reviewed by Team Lead or peer
6. [ ] Documentation updated if needed
7. [ ] Task marked as completed

## 7. Escalation Process

1. **Blocking Issue**: Agent sends message to Team Lead
2. **Team Lead Response**: Within same session
3. **Resolution Options**:
   - Reassign task
   - Provide guidance
   - Escalate to user

## 8. Meeting Points

Agents should synchronize at these points:

- Start of each phase
- Integration checkpoints
- End of parallel work streams
- Before release

---

*This workflow is designed for automated multi-agent collaboration. Adjust as needed based on project requirements.*
