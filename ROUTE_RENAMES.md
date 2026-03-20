# Route Renames

## Users

`GET /users/:email` -> `GET /users/by-email/:email`
`PATCH /users/:userId` -> `PATCH /users/id/:userId`
`DELETE /users/:userId` -> `DELETE /users/id/:userId`

## Roles

`GET /roles/:id` -> `GET /roles/id/:id`
`PATCH /roles/:id` -> `PATCH /roles/id/:id`
`DELETE /roles/:id` -> `DELETE /roles/id/:id`

## Tags

`GET /tags/:id` -> `GET /tags/id/:id`
`PATCH /tags/:id` -> `PATCH /tags/id/:id`
`DELETE /tags/:id` -> `DELETE /tags/id/:id`

## Event Categories

`GET /event-categories/:id` -> `GET /event-categories/id/:id`
`PATCH /event-categories/:id` -> `PATCH /event-categories/id/:id`
`DELETE /event-categories/:id` -> `DELETE /event-categories/id/:id`

## Program Categories

`GET /program-categories/:id` -> `GET /program-categories/id/:id`
`PATCH /program-categories/:id` -> `PATCH /program-categories/id/:id`
`DELETE /program-categories/:id` -> `DELETE /program-categories/id/:id`

## Project Categories

`GET /project-categories/:id` -> `GET /project-categories/id/:id`
`PATCH /project-categories/:id` -> `PATCH /project-categories/id/:id`
`DELETE /project-categories/:id` -> `DELETE /project-categories/id/:id`

## Expertises

`GET /expertises/:id` -> `GET /expertises/id/:id`
`PATCH /expertises/:id` -> `PATCH /expertises/id/:id`
`DELETE /expertises/:id` -> `DELETE /expertises/id/:id`

## Comments

`GET /comments/:id` -> `GET /comments/id/:id`
`PATCH /comments/:id` -> `PATCH /comments/id/:id`
`DELETE /comments/:id` -> `DELETE /comments/id/:id`

## Events

`GET /events/:eventId` -> `GET /events/id/:eventId`
`PATCH /events/:eventId/publish` -> `PATCH /events/id/:eventId/publish`
`PATCH /events/:eventId/highlight` -> `PATCH /events/id/:eventId/highlight`
`PATCH /events/:eventId` -> `PATCH /events/id/:eventId`
`DELETE /events/:eventId` -> `DELETE /events/id/:eventId`
`POST /events/:eventId/gallery` -> `POST /events/id/:eventId/gallery`
`POST /events/:eventId/cover` -> `POST /events/id/:eventId/cover`
`POST /events/:eventId/participate` -> `POST /events/id/:eventId/participate`

## Programs

`PATCH /programs/:programId/publish` -> `PATCH /programs/id/:programId/publish`
`GET /programs/:programId` -> `GET /programs/id/:programId`
`PATCH /programs/:programId/highlight` -> `PATCH /programs/id/:programId/highlight`
`PATCH /programs/:programId` -> `PATCH /programs/id/:programId`
`DELETE /programs/:programId` -> `DELETE /programs/id/:programId`
`POST /programs/:programId/logo` -> `POST /programs/id/:programId/logo`

## Subprograms

`PATCH /subprograms/:subprogramId/publish` -> `PATCH /subprograms/id/:subprogramId/publish`
`GET /subprograms/:subprogramId` -> `GET /subprograms/id/:subprogramId`
`PATCH /subprograms/:subprogramId/highlight` -> `PATCH /subprograms/id/:subprogramId/highlight`
`PATCH /subprograms/:subprogramId` -> `PATCH /subprograms/id/:subprogramId`
`DELETE /subprograms/:subprogramId` -> `DELETE /subprograms/id/:subprogramId`
`POST /subprograms/:subprogramId/logo` -> `POST /subprograms/id/:subprogramId/logo`

## Ventures

`GET /ventures/:ventureId` -> `GET /ventures/id/:ventureId`
`PATCH /ventures/:slug` -> `PATCH /ventures/by-slug/:slug`
`DELETE /ventures/:id` -> `DELETE /ventures/id/:id`
`POST /ventures/:ventureId/gallery` -> `POST /ventures/id/:ventureId/gallery`
`POST /ventures/:ventureId/logo` -> `POST /ventures/id/:ventureId/logo`
`POST /ventures/:ventureId/cover` -> `POST /ventures/id/:ventureId/cover`

## Products

`DELETE /products/:id` -> `DELETE /products/id/:id`
`POST /products/:productId/gallery` -> `POST /products/id/:productId/gallery`

## Articles

`PATCH /articles/:articleId/publish` -> `PATCH /articles/id/:articleId/publish`
`GET /articles/:articleId` -> `GET /articles/id/:articleId`
`PATCH /articles/:articleId/highlight` -> `PATCH /articles/id/:articleId/highlight`
`PATCH /articles/:articleId` -> `PATCH /articles/id/:articleId`
`DELETE /articles/:articleId` -> `DELETE /articles/id/:articleId`
`POST /articles/:articleId/gallery` -> `POST /articles/id/:articleId/gallery`
`POST /articles/:articleId/cover` -> `POST /articles/id/:articleId/cover`

## Mentors

`PATCH /mentors/request/:mentorId` -> `PATCH /mentors/requests/:mentorId`
`PATCH /mentors/:mentorId` -> `PATCH /mentors/applications/:mentorId` (mise à jour administrative d'une candidature)
`PATCH /mentors/:mentorId/approve` -> `PATCH /mentors/id/:mentorId/approve`
`PATCH /mentors/:mentorId/reject` -> `PATCH /mentors/id/:mentorId/reject`
`GET /mentors/:mentorId` -> `GET /mentors/id/:mentorId`
`PATCH /mentors/:mentorId` -> `PATCH /mentors/id/:mentorId` (mise à jour du profil mentor)
`DELETE /mentors/:mentorId` -> `DELETE /mentors/id/:mentorId`
`POST /mentors/:mentorId/cv` -> `POST /mentors/id/:mentorId/cv`

## Phases

`POST /phases/:projectId` -> `POST /phases/project/:projectId`
`GET /phases/:phaseId` -> `GET /phases/id/:phaseId`
`PATCH /phases/:phaseId` -> `PATCH /phases/id/:phaseId`
`DELETE /phases/:phaseId` -> `DELETE /phases/id/:phaseId`

## Deliverable Submissions

`POST /deliverables/:deliverableId/:participationId/submissions` -> `POST /deliverables/id/:deliverableId/participations/:participationId/submissions`

## Notifications

`PATCH /notifications/:notificationId` -> `PATCH /notifications/id/:notificationId`
`DELETE /notifications/:notificationId` -> `DELETE /notifications/id/:notificationId`
`POST /notifications/:notificationId/attachments` -> `POST /notifications/id/:notificationId/attachments`

## Projects

`GET /projects/:projectId` -> `GET /projects/id/:projectId`
`PATCH /projects/:projectId/publish` -> `PATCH /projects/id/:projectId/publish`
`PATCH /projects/:projectId/highlight` -> `PATCH /projects/id/:projectId/highlight`
`PATCH /projects/:projectId` -> `PATCH /projects/id/:projectId`
`DELETE /projects/:projectId` -> `DELETE /projects/id/:projectId`
`GET /projects/:projectId/participations` -> `GET /projects/id/:projectId/participations`
`POST /projects/:projectId/participate` -> `POST /projects/id/:projectId/participate`
`POST /projects/:projectId/participants/import-csv` -> `POST /projects/id/:projectId/participants/import-csv`
`POST /projects/:projectId/gallery` -> `POST /projects/id/:projectId/gallery`
`POST /projects/:projectId/cover` -> `POST /projects/id/:projectId/cover`
`POST /projects/:projectId/notifications` -> `POST /projects/id/:projectId/notifications`

## Resources

`PATCH /resources/:id` -> `PATCH /resources/id/:id`
`DELETE /resources/:id` -> `DELETE /resources/id/:id`
