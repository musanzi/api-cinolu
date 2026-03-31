# AI Coach Frontend Integration Guide

This guide explains how the frontend should integrate with the AI Coach backend already implemented in this API.

## Overview

Each venture owner gets a dedicated AI coach.

- The coach is automatically assigned when a venture is created.
- An initial diagnostic is generated and stored in the coach conversation.
- The entrepreneur can later chat with the coach about that same venture.
- Every API response is wrapped by the global interceptor as:

```json
{
  "data": {}
}
```

## Authentication

These endpoints require the user to be authenticated with the same session-based auth already used by the platform.

- Send credentials/cookies with requests.
- The current user must be the owner of the venture.
- If the venture does not belong to the current user, the API returns an error.

Example with `fetch`:

```ts
await fetch(`${API_URL}/ventures/id/${ventureId}/coach`, {
  credentials: 'include'
});
```

## Base Route

All coach endpoints are scoped to a venture:

```text
/ventures/id/:ventureId/coach
```

## Integration Flow

Recommended frontend flow:

1. User creates a venture.
2. Frontend navigates to the venture coach screen.
3. Frontend fetches coach metadata.
4. Frontend fetches the stored conversation.
5. Frontend renders the latest diagnostic as the first assistant message.
6. User sends a new message.
7. Frontend appends the new structured coach response to the chat UI.

## Endpoints

### 1. Get coach metadata

```http
GET /ventures/id/:ventureId/coach
```

Purpose:

- Load the coach identity and allowed output types.
- Show the coach card or sidebar before opening the conversation.

Example response:

```json
{
  "data": {
    "id": "coach-id",
    "created_at": "2026-03-31T09:00:00.000Z",
    "updated_at": "2026-03-31T09:00:00.000Z",
    "deleted_at": null,
    "name": "Coach diagnostic AgriNova",
    "profile": "Coach stratégique spécialisé dans l'accompagnement des entrepreneurs du secteur agritech.",
    "role": "Diagnostiquer la venture AgriNova, identifier les risques prioritaires et proposer des actions concrètes adaptées au stade seed.",
    "expected_outputs": ["DIAGNOSTIC", "RECOMMENDATIONS", "RISKS", "NEXT_ACTIONS", "CLARIFICATION"],
    "model": "llama3.2:3b",
    "status": "active",
    "venture": {
      "id": "venture-id"
    }
  }
}
```

Frontend usage:

- Show `name` as the coach title.
- Show `profile` and `role` in the coach intro panel.
- Use `expected_outputs` to map badges, colors, or sections in the UI.

### 2. Get the stored conversation

```http
GET /ventures/id/:ventureId/coach/conversation
```

Purpose:

- Load the persisted conversation for the venture.
- Restore previous user and coach messages when the screen opens.

Example response:

```json
{
  "data": {
    "id": "conversation-id",
    "created_at": "2026-03-31T09:01:00.000Z",
    "updated_at": "2026-03-31T09:10:00.000Z",
    "deleted_at": null,
    "status": "active",
    "messages": [
      {
        "id": "message-1",
        "role": "assistant",
        "output_type": "DIAGNOSTIC",
        "content": "AgriNova doit clarifier sa proposition de valeur pour les petits producteurs.",
        "payload": {
          "type": "DIAGNOSTIC",
          "title": "Diagnostic initial",
          "summary": "AgriNova doit clarifier sa proposition de valeur pour les petits producteurs.",
          "bullets": [
            "Le problème des pertes post-récolte est pertinent.",
            "Le ciblage du marché doit être mieux quantifié."
          ],
          "ventureFocus": "AgriNova répond aux pertes post-récolte pour les small farmers.",
          "scopeCheck": {
            "profile": "Coach stratégique",
            "role": "Diagnostic venture",
            "grounded": true
          }
        }
      },
      {
        "id": "message-2",
        "role": "user",
        "output_type": "USER_MESSAGE",
        "content": "Quelle est la prochaine priorité ?",
        "payload": {
          "message": "Quelle est la prochaine priorité ?"
        }
      }
    ]
  }
}
```

Frontend usage:

- Render `messages` in chronological order.
- For `role === "user"`, render a standard user bubble.
- For `role === "assistant"`, prefer rendering from `payload` when available, not just `content`.
- `output_type` is useful for icons and message grouping.

### 3. Send a message to the coach

```http
POST /ventures/id/:ventureId/coach/messages
Content-Type: application/json
```

Request body:

```json
{
  "message": "Quelle est la prochaine priorité commerciale ?"
}
```

Response body:

```json
{
  "data": {
    "type": "NEXT_ACTIONS",
    "title": "Prochaine priorité",
    "summary": "Valide rapidement la demande avec un petit groupe de clients pilotes.",
    "bullets": [
      "Identifier 5 à 10 clients pilotes.",
      "Mesurer la fréquence réelle du problème.",
      "Documenter les objections à l'achat."
    ],
    "ventureFocus": "Cette action aide AgriNova à confirmer la traction auprès des small farmers.",
    "scopeCheck": {
      "profile": "Coach stratégique spécialisé dans l'accompagnement des entrepreneurs du secteur agritech.",
      "role": "Diagnostiquer la venture AgriNova, identifier les risques prioritaires et proposer des actions concrètes adaptées au stade seed.",
      "grounded": true
    }
  }
}
```

Important notes:

- The response is already validated by the backend.
- `type` is always constrained to the coach configuration.
- The response is venture-aware and should be displayed as structured content.

## Suggested Frontend Types

```ts
export type CoachOutput = {
  type: string;
  title: string;
  summary: string;
  bullets: string[];
  ventureFocus: string;
  scopeCheck: {
    profile: string;
    role: string;
    grounded: boolean;
  };
};

export type CoachMessage = {
  id: string;
  role: 'user' | 'assistant';
  output_type: string;
  content: string;
  payload: Record<string, unknown>;
  created_at?: string;
};

export type CoachConversation = {
  id: string;
  status: string;
  messages: CoachMessage[];
};

export type AiCoach = {
  id: string;
  name: string;
  profile: string;
  role: string;
  expected_outputs: string[];
  model: string;
  status: string;
};

export type ApiResponse<T> = {
  data: T;
};
```

## Suggested UI Mapping

Recommended rendering for assistant responses:

- `title`: message header
- `summary`: short highlighted paragraph
- `bullets`: checklist or action list
- `ventureFocus`: small context block like "Why this matters for your venture"
- `type`: badge such as `Diagnostic`, `Risks`, `Recommendations`, `Next actions`, `Clarification`

Suggested badge mapping:

```ts
const coachTypeLabel: Record<string, string> = {
  DIAGNOSTIC: 'Diagnostic',
  RECOMMENDATIONS: 'Recommendations',
  RISKS: 'Risks',
  NEXT_ACTIONS: 'Next actions',
  CLARIFICATION: 'Clarification'
};
```

## Suggested Data Fetching Strategy

On coach page load:

```ts
const [coachRes, conversationRes] = await Promise.all([
  api.get<ApiResponse<AiCoach>>(`/ventures/id/${ventureId}/coach`),
  api.get<ApiResponse<CoachConversation>>(`/ventures/id/${ventureId}/coach/conversation`)
]);

const coach = coachRes.data.data;
const conversation = conversationRes.data.data;
```

On send message:

```ts
const response = await api.post<ApiResponse<CoachOutput>>(`/ventures/id/${ventureId}/coach/messages`, {
  message: input
});

const coachOutput = response.data.data;
```

Recommended UX:

- Disable the send button while the request is in flight.
- Optimistically append the user message locally.
- Append the assistant message when the server returns.
- If the request fails, keep the user message in a failed state and allow retry.

## Error Handling

The backend throws short French error messages.

Common cases:

- `Accès au coach refusé`
- `Coach introuvable`
- `Conversation introuvable`
- `Message impossible`
- `Réponse hors périmètre`
- `Réponse non liée à la venture`

Frontend recommendations:

- Show a generic toast for failed requests.
- Show an access message if the current user is not the venture owner.
- If the conversation is missing, retry loading the coach first.
- If the model is temporarily unavailable, allow the user to retry sending.

## Rendering Stored Messages

When reading conversation history:

- For `USER_MESSAGE`, render `content`.
- For assistant entries, read `payload` as `CoachOutput`.
- Fall back to `content` if `payload` is missing or malformed.

Example:

```ts
function isCoachOutput(value: unknown): value is CoachOutput {
  if (!value || typeof value !== 'object') return false;
  const output = value as CoachOutput;
  return !!output.type && !!output.title && Array.isArray(output.bullets);
}
```

## Venture Creation Hand-off

After a venture is created, the frontend should not ask the user to create a coach manually.

Recommended hand-off:

1. Create the venture with the existing venture flow.
2. Redirect to the venture detail or coach tab.
3. Request coach metadata.
4. Request conversation.
5. Show the initial diagnostic if already available.

If coach creation is still processing, the frontend can retry the conversation fetch after a short delay.

## Current Limitations

The current backend implementation has these practical constraints:

- Responses are structured, but output types are still strings, not strict frontend enums.
- There is no streaming response yet.
- There is no dedicated loading status endpoint for coach generation.
- The initial diagnostic is saved in the conversation, but there is no separate "latest diagnostic" endpoint.

## Recommended Next Frontend Enhancements

- Add a dedicated coach tab inside the venture details page.
- Support rich rendering for each `type`.
- Cache coach metadata per venture.
- Add retry UI for transient inference failures.
- Add a "diagnostic summary" card based on the latest assistant `DIAGNOSTIC` message.
