# CINOLU Platform Migration Plan

## Goal
Migrate the current API from a generic incubator/content backend into a hub-driven smart-city innovation platform without losing operational continuity.

This plan assumes an incremental migration on top of the existing NestJS + TypeORM codebase.

---

# 1. Migration Principles

## 1.1 Do not rewrite everything at once
Migrate in layers.
Keep the current system running while introducing the new model gradually.

## 1.2 Add before removing
Introduce new entities and relations first.
Only deprecate old structures after the frontend and data flows are stable.

## 1.3 Preserve public continuity
Existing URLs and public content should keep working where possible while the new hub structure is rolled out.

## 1.4 Separate structural migration from content migration
Database/schema changes and business/content reclassification should be treated as different workstreams.

---

# 2. Current to Target Mapping

## Current main concepts
- `Program`
- `Subprogram`
- `Project`
- `Event`
- `Venture`
- `MentorProfile`
- `Article`
- `Stats`

## Target main concepts
- `Hub`
- `Opportunity`
- `Application`
- `SupportJourney`
- enriched `Program`
- more purposeful `Project`
- enriched `Venture`
- hub-aware `Event`
- hub-aware `MentorProfile`
- structured content/reporting

---

# 3. Migration Phases

## Phase 1 — Structural foundation

### Objective
Introduce the new core organizing model without breaking current operations.

### Tasks
1. create `Hub` entity and module
2. seed initial hubs:
   - General Support
   - Mintech
   - Greentech
   - Gender Inclusion
3. add nullable `hub_id` to:
   - programs
   - subprograms
   - projects
   - events
   - ventures
   - articles
4. add optional hub relation to mentors/resources later if needed in same phase
5. add filters to existing endpoints by `hubId` / `hubSlug`

### Deliverable
The platform can already organize current content and operations by hub, even before deeper workflow changes.

---

## Phase 2 — Reclassify existing data

### Objective
Map the current system into the new strategic model.

### Tasks
1. assign each current program to a hub
2. assign each subprogram to a hub
3. assign each project to a hub
4. assign each event to a hub
5. assign each venture to a hub
6. assign relevant articles/highlights to hubs
7. define rules for multi-fit cases:
   - choose a primary hub first
   - use secondary tags later if necessary

### Deliverable
The current platform starts reflecting CINOLU’s new structure without yet changing the user journey.

---

## Phase 3 — Add Opportunity layer

### Objective
Introduce a proper public entry point for support offers.

### Tasks
1. create `Opportunity` module
2. define opportunity types
3. link opportunities to hubs and optionally programs
4. create admin CRUD + publish flow
5. expose public endpoints for open opportunities
6. update frontend to show opportunities as first-class public objects

### Why now
This gives CINOLU a clean public-facing structure for calls, competitions, support tracks, and bootcamps.

### Deliverable
The platform stops relying only on projects/programs as public entry objects.

---

## Phase 4 — Add Application and pipeline workflow

### Objective
Create a proper intake model.

### Tasks
1. create `Application` entity/module
2. create `IntakeQuestion` and `ApplicationAnswer`
3. create `ApplicationReview`
4. create `PipelineTransition`
5. implement status flow:
   - draft
   - submitted
   - screening
   - hub_review
   - qualified
   - re_routed
   - accepted
   - rejected
   - active_support
   - completed
   - alumni
6. add review interfaces for staff
7. connect accepted applications to support delivery

### Migration decision
Do not migrate every old record into `Application` blindly.
Only migrate where it creates real business value.
Historical project participation records can remain historical if needed.

### Deliverable
CINOLU gains a real intake and qualification engine.

---

## Phase 5 — Add SupportJourney layer

### Objective
Separate intake from actual support delivery.

### Tasks
1. create `SupportJourney`
2. link `Application -> SupportJourney` when accepted
3. connect support journey to:
   - hub
   - venture
   - program
   - project
4. optionally connect to mentor sessions and milestone tracking

### Why
This prevents `Project` or `Program` from being overloaded as the only journey container.

### Deliverable
Founder support becomes traceable from entry to active support.

---

## Phase 6 — Enrich Venture model and add Venture Intelligence

### Objective
Make ventures the main long-term evidence object.

### Tasks
1. add fields to venture:
   - primary hub
   - smart-city domain
   - subsector
   - business model
   - stage
   - traction summary
   - impact summary
   - fundraising status
2. create `VentureMetric`
3. create `VentureMilestone`
4. create `VentureReport`
5. create `OutcomeSnapshot`
6. optionally create `AlumniProfile`

### Data migration approach
- keep current venture records
- backfill new fields progressively
- allow partial completion at first
- mark completeness for admin follow-up

### Deliverable
Venture profiles become useful for internal tracking and public reporting.

---

## Phase 7 — Enrich Programs, Projects, and Events

### Objective
Make execution structures reflect specialization and purpose.

### Tasks
1. extend `Program` with:
   - support type
   - target stage
   - target sector
   - expected outcomes
   - application timeline
2. extend `Project` with:
   - project type
   - support goal
   - target stage
   - expected outputs
3. extend `Event` with:
   - event type
   - target audience
   - pipeline goal
   - outcome summary

### Deliverable
The current operational objects become easier to reason about and align with strategy.

---

## Phase 8 — Mentor and resource specialization

### Objective
Make support capacity hub-aware.

### Tasks
1. add hub associations to mentors
2. add specialization areas to mentors
3. create `MentorSession`
4. enrich resources with:
   - hub
   - stage
   - visibility rules
   - smart-city relevance

### Deliverable
Mentors and resources become better aligned with thematic support.

---

## Phase 9 — Public storytelling and impact layer

### Objective
Make the public platform reflect the new model.

### Tasks
1. add hub public endpoints
2. enrich article classification:
   - success story
   - opportunity
   - impact story
   - insight
   - partner update
3. link articles to hubs/ventures/programs/partners
4. create impact endpoints by hub
5. create venture showcase filters by hub and stage

### Deliverable
The website becomes visibly specialized and more credible.

---

## Phase 10 — Reporting and partner visibility

### Objective
Turn data into partner- and leadership-ready reporting.

### Tasks
1. extend `stats` module with hub-based reporting
2. add conversion metrics from application to support
3. add venture outcome reporting
4. create `PartnerReport`
5. expose public impact summaries where appropriate

### Deliverable
CINOLU can report meaningful impact by thematic area.

---

## Phase 11 — Legacy cleanup

### Objective
Reduce confusion and retire weak structures.

### Tasks
1. audit all subprograms
2. decide which become:
   - real subprograms
   - opportunities
   - projects
   - support tracks
   - deprecated records
3. review Ushindi/Uvumbuzi placement
4. reduce dependence on generic categories
5. keep highlights only as presentation layer
6. deprecate endpoints that no longer fit the new model

### Deliverable
A cleaner, more intentional domain model.

---

# 4. Entity Migration Notes

## Programs
**Current state:** generic program container  
**Target state:** hub-owned strategic support object

**Action:** add hub relation and strategic metadata.

## Subprograms
**Current state:** nested structure under programs  
**Target state:** keep only if operationally meaningful

**Action:** audit each one; merge/reclassify weak or redundant subprograms.

## Projects
**Current state:** broad execution object  
**Target state:** explicit support execution unit

**Action:** add hub relation and project type; stop using project as a generic catch-all.

## Ventures
**Current state:** profile/showcase object  
**Target state:** long-term tracked startup entity

**Action:** enrich heavily and attach to venture intelligence modules.

## Events
**Current state:** event management object  
**Target state:** pipeline + visibility tool

**Action:** add hub relation, type, and outcome metadata.

## Articles
**Current state:** generic blog content  
**Target state:** structured storytelling asset

**Action:** add type + hub and business links.

---

# 5. API Compatibility Strategy

## Short term
- keep existing endpoints alive
- add new optional query params and fields
- introduce new modules in parallel

## Medium term
- route frontend gradually to new hub/opportunity/application endpoints
- introduce new admin flows for classification and reporting

## Long term
- deprecate endpoints and fields that represent outdated business structure
- document deprecations explicitly

---

# 6. Data Backfill Strategy

## Backfill in this order
1. hubs
2. program -> hub mapping
3. subprogram -> hub mapping
4. project -> hub mapping
5. venture -> hub mapping
6. event -> hub mapping
7. article -> hub mapping
8. venture enrichment
9. opportunity/application records for new flows only

## Recommended practical approach
- use scripts for deterministic mappings
- use admin review for ambiguous records
- keep a `migration_notes` field/log for manual decisions where useful

---

# 7. Risk Management

## Main risks
- overloading old entities while adding new ones
- keeping too many legacy structures alive too long
- weak data reclassification due to ambiguous historical records
- frontend confusion during transition

## Mitigation
- centralize business glossary early
- define exact meaning of hub/program/project/opportunity/application
- migrate in phases
- deprecate intentionally, not accidentally
- avoid trying to perfectly backfill every historical workflow

---

# 8. Recommended Delivery Order

## Sprint sequence
1. Hubs
2. Hub classification/backfill
3. Opportunities
4. Applications + review pipeline
5. Support journeys
6. Venture intelligence
7. Program/project/event enrichment
8. Mentor/resources enrichment
9. Public impact/storytelling
10. Reporting
11. Legacy cleanup

---

# 9. Final Migration Recommendation

The safest and strongest migration path is:

1. **introduce hubs first**
2. **classify the existing system around hubs**
3. **add opportunities and applications for future intake**
4. **separate support delivery through support journeys**
5. **upgrade ventures into the main impact-tracking object**
6. **clean up legacy structures only after the new model is stable**

This approach preserves continuity while still allowing a real structural reset.