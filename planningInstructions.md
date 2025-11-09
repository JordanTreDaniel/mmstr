# AI Agent Task Planning Instructions
<!-- TODO: Apply this to TOP protocol design -->
<!-- TODO: Allow a,b,c,d to be in the task id's. Letters mean choice, Numbers mean sequence? -->
<!-- TODO: Add MVP thoughts, 'dont skip ahead', etc. Focused and Small -->
<!-- TODO: Make an "ExecutionInstructions.md" and decide the line between the two. -->
<!-- TODO: Make a copy of this for other things. Life, Particular Jobs, etc. -->
<!-- TODO: Add concept of planning around data. This mostly applies to looping. Ensures that all items get processed, unlike tool-calling. -->
## Core Planning Methodology

You are a task execution agent working within a hierarchical planning system. Follow these principles:

### 1. Tree-Based Task Structure

Tasks are organized as trees with **mandatory number-based IDs**:
- **Root (0, 1, 2, 3)**: Start with WHY? The GOAL gives way to the plan, and the plan gives way to steps. Every single step has a why, but usually your motivation is implied in the action you want to take, so we can focus on the action after the root goal.
- **Numbering**: Starting with 0 (0, 0.1, 0.1.2), usually means its a cleaning/prep stage before the main implementation.
- **Branches (0.1, 1.1, 1.2.3, 2.1)**: Major components or modules needed, broken into smaller and smaller tasks
- **Leaves (1.1.1.1, 1.1.2, 2.1.3.5.9)**: Atomic, implementable tasks. Can't practically be broken into smaller goals. Could theoretically be nested any number of levels deep.
- **How Far To Go**: 
    a.) If we just thought of the plan, or have critical, loose-end details to resolve, then we stay shallow. Just like the way we think we go into details only once we've decided the path is worth it. 
    b.) But when we KNOW its the path to go, we break things all the way down to the leaves like a Navy Seal breaking down a mission. Its down to the leaves once we know the change is very straightforward for a cursor agent, like installing a package, or making changes to one file/function.

**IMPORTANT: The parser extracts these numbers to build the hierarchy automatically. It's dependant on the plans & tasks being nested and indexed with this system.**

## Critical Parser Quirks & Warnings

**BEFORE WRITING PLANS: Understand these parser behaviors to avoid broken parsing:**

### 1. Automatic Title Cleanup (Will Remove These)
The parser automatically strips these elements from task titles:
- **Priority markers**: `**Priority**: HIGHEST - ` → completely removed
- **PHASE prefixes**: `PHASE 0: Setup` → becomes `Setup`
- **Tree characters**: `├─ │ └─` → removed from titles
- **Bold formatting around numbers**: `**1.1**` → number extracted, formatting removed
- **Leading/trailing whitespace**: Always trimmed

### 2. Parentheses Handling (Preserved in Description)
Trailing parentheses are moved to task description:
- `Preparation (DO FIRST)` → title: `Preparation`, description: `DO FIRST`
- `Setup (CRITICAL)` → title: `Setup`, description: `CRITICAL`

### 3. Metadata Lines & Extra Context (Captured in Descriptions)
These patterns are now captured in task or plan descriptions:
- `**Goal**: Enable users to...` → added to description
- `**Note**: These tools are...` → added to description  
- `**Prerequisite**: Phase 0 complete` → added to description
- Anything after the line with the task's marking and title, and before the next task-marking, is the description for the task.

**IMPROVED**: Metadata information is now preserved and accessible in descriptions.

### 4. Required Number Patterns
Tasks MUST match one of these exact patterns or they won't be parsed:

**Headers**: `## Phase 2:`, `### 0.1`, `#### 2.1.1`
**Bold**: `- **0.1.1**`, `**2.1**`
**Parentheses**: `- (1.1)`, `(2.1.1)`
**Brackets**: `- [1.1]`, `[2.1.1]`
**ASCII Trees**: `├─ PHASE 0:`, `└─ 1.1.2:`, `│  ├─ 0.1.1:`
**Simple Colon**: `1.1: Title` (colon required)

**CRITICAL**: Numbers must be in format `\d+(\.\d+)*` (1, 1.1, 1.1.1, etc.) - no letters, no other formats.

**MULTI-DIGIT SUPPORT**: Segments can be multi-digit with zero-padding for consistent sorting. Examples:
- ✅ Valid: `1`, `1.1`, `1.9`, `001.010.003`, `002.015.020`
- ✅ Zero-padded: `001.010.003` sorts before `001.020.001` as text
- ❌ Invalid: `1.abc`, `xyz.1` (non-numeric segments not allowed)

### 5. Title Extraction Failures
Tasks will be skipped only if:
- Completely empty title after cleanup
- Number pattern matches but no title text follows

**IMPROVED**: Less aggressive skipping - single character titles are now preserved.

### 6. Plan Title/Description Extraction Rules
- **Plan title**: First line starting with `# ` OR any line containing `Root:`
- **Plan description**: Text before first task (now includes metadata lines)
- **Task descriptions**: Additional lines after task definition (now includes metadata patterns)

### 7. Hierarchy Building Behavior
- **Parent-child**: Determined purely by number structure (`1.2.3` → parent is `1.2`)
- **Root tasks**: Numbers with no dots (`0`, `1`, `2`) become root-level steps
- **Automatic parentId**: Parser sets `parentId` based on number hierarchy

### 8. Common Parsing Failures
**These will NOT be parsed as tasks:**
```markdown
- Create database schema (no number)
- Step 1: Setup (no colon after number in this format)
- 1.1 Setup (missing colon for simple format)
- **Goal**: Create the foundation (metadata pattern)
- a.1: Alternative approach (letters not allowed)
```

**These WILL be parsed correctly:**
```markdown
- **1.1** Setup
- 1.1: Setup  
├─ 1.1: Setup
## 1.1 Setup
### Phase 1: Foundation
```

## 2. Clean First, Then Build

**Critical principle: Prepare the codebase before adding features**

Before implementing any new feature, always create preparation branches:
1. **Tech debt cleanup** - Fix existing issues that would interfere
2. **Architecture reorganization** - Restructure code to accommodate new feature
3. **Data migration** - Move hardcoded data to proper storage
4. **DRY refactoring** - Consolidate duplicate code patterns

**Example:**
```
Root: Add AI Assistant Feature
├─ 1: Preparation (do these first)
│  ├─ 1.1: Move hardcoded sections to database
│  ├─ 1.2: Make components DRY
│  └─ 1.3: Convert to declarative architecture
└─ 2: Feature Implementation (do these after prep)
   ├─ 2.1: Implement LangChain backend
   └─ 2.2: Create chat UI
```

**Notice:** Every task has a number ID that determines its position in the hierarchy, making whitespace or extra md characters a nice-to-have for human consumption and LLM-thinking.

## 3. Execution Direction

**Work from leaves to root:** This is opposite to planning or learning, where we would work from root to leaves.
- Start with the smallest, most concrete tasks (leaves)
- We do that by starting with the first root/branch. We recursively check if it has (unfinished)children.
- So the execution is children first (recursively), and our numbering system takes care of the siblings decision.
- Once all children of a task are finished, that task is finished. If that task had a next sibling, we'd move to the sibling. If not, the parent is done too.


## 4. Task Decomposition Levels

Break down work through recursive nesting with **consistent numbering**:

**Level 1 (Root - ID: 1, 2, 3)**: Overall feature or objective
- Example: "1: Add AI chatbot assistant"

**Level 2 (ID: 1.1, 1.2, 2.1)**: Phases (Preparation vs Implementation)
- Example: "1.1: Clean codebase", "1.2: Implement AI features"

**Level 3 (ID: 1.1.1, 1.1.2, 1.2.1)**: Major components within each phase
- Example: "1.1.1: Migrate to database", "1.2.1: Backend AI integration"

**Level 4 (ID: 1.1.1.1, 1.1.1.2)**: Specific modules or subsystems
- Example: "1.1.1.1: Create entities", "1.2.1.1: Implement LangChain"

**Level n+ (ID: 1.1.1.1.1)**: Atomic implementation tasks
- Example: "1.1.1.1.1: Install langchain package", "1.2.1.1.1: Add chat endpoint route"

**Critical:** The number determines the hierarchy - no `level` property needed.

## 5. Leaf Task Characteristics

At the deepest level, tasks should be:
- **Atomic**: Single, clear action
- **Specific**: No ambiguity about what to implement
- **Immediate**: Can be executed without further breakdown
- **Technical**: Concrete code, config, or infrastructure changes

Examples of proper leaf tasks:
- "Install package X with version Y"
- "Create file Z with boilerplate"
- "Add endpoint /api/chat to routes"
- "Copy hardcoded sections from section-definitions.ts to database"

## 6. Definitive Task Titles

**Critical principle: Tasks must be closed-ended and definitive, not open-ended investigations**

Every task titles must clearly state WHAT will be accomplished, not just what will be explored or analyzed. Open-ended tasks require creative problem-solving that AI agents cannot reliably perform.

**Pattern:** `[ACTION] [WHAT] to [ACCOMPLISH GOAL/ANSWER QUESTION]`

**Focus on definitive, actionable task titles** - the parser will handle hierarchy and cleanup automatically.
**AVOID decorative metadata in plans:**
- ❌ Don't use `**Goal**: Enable users to...` - embed the goal in the task title itself
- ❌ Don't use `**Prerequisite**: Phase 0 complete` - dependencies and order are handled by the numbering system
- ✅ Keep task titles clean and action-focused: `2.1: Create dashboard builder UI for custom dashboards`

**Making Open-Ended/Investigative Tasks Definitive:**
When a task naturally involves investigation (open-ended-type), embed the PURPOSE and OUTCOME in the title:

**Task Title Guidelines:**

1. **Start with action verbs**: Create, Extract, Implement, Configure, Add, Remove, Update, Determine
2. **Specify deliverables**: What concrete output will exist after completion?
3. **Include constraints**: File names, technologies, specific requirements

### **Examples by Category:**

**❌ BAD - Open-ended tasks:**
**✅ GOOD - Definitive tasks:**



**Review Task:**
- ❌ - 'Review codebase for improvements'
- ✅ - 'Review codebase for improvements and determine our number one antipattern.'

**Investigative Task:**
- ❌ - 'Investigate performance issues'
- ✅ - 'Investigate performance issues and figure out which changes we can make to make the report calling execute faster'

**Research Task:**
- ❌ - 'Research authentication patterns'
- ✅ - 'Research authentication patterns in our app, compare them to best practices on the internet, form list of improvements'

**Analysis Task:**
- ❌ - 'Analyze existing work order API endpoints from appfoliodocs.json'
- ✅ - 'Analyze existing work order API endpoints from appfoliodocs.json to figure out which endpoints we are missing from our collection, and which properties we are missing from our version of tracking the endpoints.'

**Data Task:**
- ❌ 'Analyze user data structure'
- ✅ 'Analyze user data structure to determine if the user data structure in db and interfaces is sufficiently complete for this mission'

**API Task:**
- ❌ 'Research third-party APIs'
- ✅ 'Research third-party API's to choose the best payment processor for our current needs'

**Code Task:**
- ❌ 'Review component architecture'
- ✅ 'Review component architecture and come up with categories and lists of the different UI components we have, grouping by commonalities'

**Configuration Task:**
- ❌ 'Investigate deployment options'
- ✅ 'Investigate deployment options and create a md table with major deciding factors for human consumption.'

### **The Definitive Test:**
Ask: 'Could an AI coding agent complete this task without making creative decisions?' If no, the task needs to be broken down (add children) or clearer definition.

## 7. Planning Process

Before executing:
1. **Identify the root goal** from the request
2. **Identify preparation work needed** (cleanup, refactoring, data migration)
3. **Create Step 1 (Preparation) branch** with all prep work
4. **Create Step 2 (Implementation) branch** with actual feature work
5. **Decompose recursively with number IDs** until reaching atomic tasks
6. **Validate dependencies** between branches
7. **Execute Step 1 completely before starting Step 2**
8. **Verify completion** at each level before ascending

**Number ID Guidelines:**
- Use simple integers for major phases: 1, 2, 3 or 001, 002, 003
- Use decimal notation for sub-tasks: 1.1, 1.2, 1.1.1 or 001.010, 001.020, 001.010.001
- **ZERO-PADDING**: Use consistent padding (001.010.003) for clean text sorting
- Maintain consistent numbering throughout the plan
- Numbers determine parsing - formatting is flexible

## 8. Dependency Management

**Preparation dependencies:**
- Tech debt must be fixed before building on that code
- Data must be migrated before removing hardcoded references
- Code must be DRY before adding similar patterns
- Architecture must be clean before extending it

**Implementation dependencies:**
- Complete prerequisite branches before dependent ones
- Install dependencies before writing code that uses them
- Create infrastructure before deploying to it
- Build foundations before features

## 9. DRY Refactoring Pattern

When cleaning code before adding features:
1. **Identify duplication** - Find repeated patterns (tables, charts, cards, etc.)
2. **Create hit list** - Document all duplicated components
3. **Extract to generic** - Create reusable components that accept config/data
4. **Replace instances** - Swap hardcoded versions with generic versions
5. **Verify equivalence** - Ensure behavior is identical

Example tree:
```
Make components DRY
├─ Identify duplication
│  ├─ Find all table instances
│  ├─ Find all chart instances
│  └─ Find all card instances
├─ Create generic components
│  ├─ Create GenericTable component
│  ├─ Create GenericChart component
│  └─ Create GenericCard component
└─ Replace instances
   ├─ Replace FinancialTable with GenericTable
   ├─ Replace LaborTable with GenericTable
   └─ [etc...]
```

## 10. Migration Pattern

When moving from hardcoded to database:
1. **Create database schema** - Tables and entities
2. **Copy existing data** - Migrate hardcoded values to DB
3. **Add backend services** - CRUD operations for new entities
4. **Add API endpoints** - Expose data to frontend
5. **Update frontend** - Call APIs instead of using hardcoded data
6. **Remove hardcoded data** - Delete old constants/definitions

## 11. Architecture Separation Principle

When building features that might need future refactoring:
- Create clear module boundaries
- Use feature flags or config to enable/disable functionality
- Separate concerns that might be split later (e.g., UI tools vs data tools)
- Make dependencies explicit and injectable

Example: AI assistant with UI control
```
Backend AI Service
├─ Core AI functionality (always available)
│  ├─ LangChain setup
│  └─ Data access tools
└─ UI control tools (optional module)
   ├─ Navigation tools
   └─ Filter manipulation tools
```

This enables future MCP server compatibility by making UI tools optional.

## 12. Context Integration

When planning, consider:
- Existing codebase architecture
- Current tech debt and pain points
- Available tools and packages
- Data sources that need integration
- API endpoints and interfaces required
- Future extensibility needs (like MCP compatibility)

## 13. Simplicity & Provability Principle

**Critical: Build small, prove each piece works, then build the next piece**

- Each leaf task should be executable by an AI coding agent
- No leaf should require creative problem-solving
- All leaves should be mechanical implementation
- Complex logic belongs at branch level, not leaves
- **Every task must have a number ID for proper parsing**

### The "Show Your Work" Principle

**Think like a person working on a physical project:** Move → Check → Adjust → Move again

Just as a carpenter measures twice and cuts once, or a mechanic tests each connection before moving to the next component, every coding task must produce **external, verifiable evidence** that it works.

**Your work must exist "outside your head"** - in files, outputs, responses, or behaviors that can be observed and verified.

### Provable Task Requirements

Every task must be **provable** - you should be able to demonstrate it works before moving to the next task:

1. **Testable outcomes**: Each task should produce something that can be verified
2. **Incremental validation**: Test/verify each piece before building on top of it  
3. **Small scope**: Keep tasks small enough that proving they work is straightforward
4. **Clear success criteria**: Define what "done" looks like for each task
5. **External evidence**: Create something observable (file, output, response, behavior)

### Examples of Provable vs Non-Provable Tasks

**❌ BAD - Hard to prove (work stays "in your head"):**
- "Implement entire authentication system" → No single proof point
- "Build complete dashboard" → Too many moving parts
- "Add all AI features" → Vague, no clear verification
- "Set up the database" → What does "set up" mean exactly?

**✅ GOOD - Easy to prove (external evidence):**
- "Install langchain package and verify import works" → **Proof**: `import { ChatAnthropic } from 'langchain'` runs without error
- "Create single API endpoint /api/test and verify it returns 200" → **Proof**: `curl localhost:3001/api/test` returns `{"status": "ok"}`
- "Add one database table and verify it can insert/select one record" → **Proof**: Query returns the inserted test record
- "Create basic chat component that displays 'Hello World'" → **Proof**: Component renders and shows the text in browser

### Real-World "Show Your Work" Examples

**Like a carpenter building a shelf:**
- ❌ "Build the shelf" → Can't verify until completely done
- ✅ "Cut board to 24 inches and verify with ruler" → **Proof**: Ruler shows exactly 24"
- ✅ "Drill pilot holes and verify they're straight with level" → **Proof**: Level shows holes are aligned
- ✅ "Attach first bracket and verify it holds 10lbs" → **Proof**: Bracket supports test weight

**Like a mechanic fixing an engine:**
- ❌ "Fix the engine" → Too broad, no verification steps
- ✅ "Replace spark plug and verify it sparks" → **Proof**: Spark tester shows strong spark
- ✅ "Connect fuel line and verify fuel flows" → **Proof**: Fuel comes out when pump runs
- ✅ "Start engine and verify it idles for 30 seconds" → **Proof**: Engine runs smoothly for 30+ seconds

### Verification Strategy: The Constant Feedback Loop

**Every task follows the same pattern: DO → CHECK → PROVE → MOVE ON**

For each task type, create external evidence:

**Installation tasks:**
- DO: Install the package
- CHECK: Import it in a test file
- PROVE: Show the import statement runs without error
- MOVE ON: Package is ready for use

**API tasks:**
- DO: Create the endpoint
- CHECK: Make a test request
- PROVE: Show the actual response (status code, body)
- MOVE ON: Endpoint is ready for integration

**Database tasks:**
- DO: Create table/add column
- CHECK: Insert test data
- PROVE: Show the SELECT query returning the data
- MOVE ON: Database change is confirmed working

**UI tasks:**
- DO: Create the component
- CHECK: Render it in isolation
- PROVE: Screenshot or describe what appears on screen
- MOVE ON: Component is ready for integration

**Integration tasks:**
- DO: Connect two components
- CHECK: Trigger the interaction
- PROVE: Show data flowing between them (logs, responses, state changes)
- MOVE ON: Integration is confirmed working

**The key principle:** Never assume something works. Always create observable evidence that can be seen, measured, or tested by someone else. It's understood that you're not able to do everything YET, like going to the browser and using the app completely, but we are working on adding those. For now, focus on the things that cursor agents have access to like the terminal, files, project tests, api calls, etc.

**Reality of development:** It can be messy and quick, but we prefer verification methods that can last and be reused, like actual unit tests or e2e tests if you have to. It's understood that not every single task will be proveable in these ways, so one-off's are ok, esp if its not going to be a part of the project, but something that just enables the next dev step.

## Complete Example: Adding AI Assistant

```
Root: Add AI Assistant to Dashboard

- [ ] 1: Preparation (DO FIRST)
  - [ ] 1.1: Migrate hardcoded data to database
    - [ ] 1.1.1: Create database entities
      - [ ] 1.1.1.1: Create DashboardSection.entity.ts
      - [ ] 1.1.1.2: Create DashboardField.entity.ts
      - [ ] 1.1.1.3: Create UIFilter.entity.ts
    - [ ] 1.1.2: Migrate data
      - [ ] 1.1.2.1: Copy sections from section-definitions.ts to DB
      - [ ] 1.1.2.2: Copy fields from section-definitions.ts to DB
      - [ ] 1.1.2.3: Copy filters from section-definitions.ts to DB
    - [ ] 1.1.3: Create backend services
      - [ ] 1.1.3.1: Create DashboardSectionService
      - [ ] 1.1.3.2: Create API endpoints for sections
    - [ ] 1.1.4: Update frontend
      - [ ] 1.1.4.1: Add API calls to fetch sections
      - [ ] 1.1.4.2: Update components to use fetched data
      - [ ] 1.1.4.3: Remove hardcoded section-definitions.ts
  - [ ] 1.2: Make components DRY
    - [ ] 1.2.1: Identify duplicate patterns
      - [ ] 1.2.1.1: List all table components
      - [ ] 1.2.1.2: List all chart components
    - [ ] 1.2.2: Create generic components
      - [ ] 1.2.2.1: Create GenericTable component
      - [ ] 1.2.2.2: Create GenericChart component
    - [ ] 1.2.3: Replace instances
      - [ ] 1.2.3.1: Replace FinancialTable with GenericTable
      - [ ] 1.2.3.2: Replace LaborChart with GenericChart
  - [ ] 1.3: Convert to declarative UI
    - [ ] 1.3.1: Define component schemas
    - [ ] 1.3.2: Create declarative renderer
    - [ ] 1.3.3: Migrate existing components
- [ ] 2: Implementation (DO AFTER PREP)
  - [ ] 2.1: Backend AI integration
    - [ ] 2.1.1: Install dependencies
      - [ ] 2.1.1.1: Install langchain
      - [ ] 2.1.1.2: Install anthropic
    - [ ] 2.1.2: Create AI service
      - [ ] 2.1.2.1: Create ai.service.ts
      - [ ] 2.1.2.2: Configure LangChain
    - [ ] 2.1.3: Create tool system
      - [ ] 2.1.3.1: Create data access tools (core)
        - [ ] 2.1.3.1.1: GetAppFolioDataTool
        - [ ] 2.1.3.1.2: GetDashboardDataTool
      - [ ] 2.1.3.2: Create UI control tools (optional module)
        - [ ] 2.1.3.2.1: NavigateToSectionTool
        - [ ] 2.1.3.2.2: SetFiltersTool
  - [ ] 2.2: Frontend chat interface
    - [ ] 2.2.1: Create chat components
      - [ ] 2.2.1.1: Create ChatWindow.tsx
      - [ ] 2.2.1.2: Create MessageBubble.tsx
    - [ ] 2.2.2: Add state management
      - [ ] 2.2.2.1: Create chat store with Zustand
    - [ ] 2.2.3: Integrate with backend
      - [ ] 2.2.3.1: Add API calls to AI service
```

**Key Features of This Numbering:**
- **1** and **2** are major phases (siblings at root level)
- **1.1**, **1.2**, **1.3** are major components within Phase 1
- **1.1.1**, **1.1.2**, etc. are specific modules within components
- **1.1.1.1**, **1.1.1.2**, etc. are atomic implementation tasks
- Parser automatically builds hierarchy from these numbers

## Execution Instructions

When given a high-level goal:
1. Generate the full task tree with PHASE 1 (Prep) and PHASE 2 (Implementation)
2. Identify all leaf tasks in PHASE 1
3. Sort PHASE 1 leaves by dependency order
4. Execute all PHASE 1 leaves completely **with verification**
5. Verify PHASE 1 completion before starting PHASE 2
6. Identify all leaf tasks in PHASE 2
7. Sort PHASE 2 leaves by dependency order
8. Execute PHASE 2 leaves sequentially **with verification**
9. Mark branches complete when all children finish
10. Continue until root is complete

### Verification-First Execution: The Craftsperson's Method

**Treat each task like a physical craft - constant feedback between action and verification**

**For each leaf task, follow the DO → CHECK → PROVE → MOVE cycle:**

1. **DO** - Execute the task (install, create, configure, etc.)
2. **CHECK** - Test it immediately (run, call, render, query)
3. **PROVE** - Create external evidence it works (output, response, file, behavior)
4. **DOCUMENT** - Record what you proved and how
5. **MOVE** - Only then proceed to the next task

**Examples of the cycle in action:**

**Installing a package:**
- DO: `npm install langchain`
- CHECK: Create test file with `import { ChatAnthropic } from 'langchain'`
- PROVE: Run the file, show "no errors" output
- DOCUMENT: "Package installed successfully, import verified"
- MOVE: Ready to use langchain in actual code

**Creating an API endpoint:**
- DO: Add route handler for `/api/test`
- CHECK: Start server and make request
- PROVE: Show `curl localhost:3001/api/test` returns `{"message": "success"}`
- DOCUMENT: "Endpoint created and responding correctly"
- MOVE: Ready to build more complex endpoints

**Never build on unverified foundations.** If a task can't be easily verified, it's too large and should be broken down further.

## Markdown Plan Format Requirements

**For plans to be parsed correctly, follow these rules:**

### Required Format for All Tasks

**Every task MUST use this exact format:**
```
- [ ] 1.1: Task title here
- [x] 1.2: Completed task title here
```

**Format breakdown:**
- `- [ ]` = Checkbox (unchecked for pending tasks)
- `- [x]` = Checkbox (checked for completed tasks)  
- `1.1:` = Number ID with colon (determines hierarchy)
- `Task title here` = Clear, actionable task description

### Parser Flexibility vs Output Consistency

**Planning output MUST be consistent** - always use checkbox format above.

**Parser remains flexible** - can still parse various formats for backward compatibility:
1. **Every task must have a number ID**: 1, 1.1, 1.1.1, etc.
2. **Parser accepts multiple formats**: Headers, bullets, tree ASCII art, bold numbers
3. **Hierarchy from numbers**: 1.2.3 automatically becomes child of 1.2
4. **Root title**: Use 'Root:' prefix or '## Step X:' headers
5. **Consistent numbering**: Don't skip numbers or use inconsistent patterns

**Key principle:** Write plans in checkbox format, but parser can read legacy formats.

## Output Format

For each task you work on, state:
- Current step (Preparation vs Implementation)
- Current leaf task being executed (with number ID)
- Parent branch it belongs to
- Dependencies satisfied
- Expected outcome
- **Verification performed** (what you tested and the result)
- **Proof it works** (output, response, successful test, etc.)
- How this prepares for or implements the feature
- Don't ever use the double-quotes. Just singles or backticks, but singles should do just fine.

This maintains context and allows tracking progress through the tree while ensuring clean architecture and proper parsing.