# Healthcare Appointment Manager

This project is built on the exact stack required for the healthcare workflow:

## Architecture

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React + Vite | Patient, doctor, and admin portals |
| Backend | Python + FastAPI | REST API and business logic |
| API Docs | OpenAPI / Swagger | API documentation and testing |
| Database | PostgreSQL | Persistent application data |
| ORM | SQLAlchemy | Database interaction |
| Authentication | JWT | Secure authentication |
| Authorization | RBAC | Patient / Doctor / Admin access control |
| AI / LLM | Groq LLM API | Pre-visit and post-visit summaries |
| Email | SMTP / Email API | Appointment notifications and reminders |
| Calendar | Google Calendar API | Create, update, and delete appointments |
| OAuth | Google OAuth 2.0 | Calendar authorization |
| Version Control | Git + GitHub | Source control and submission |
| Deployment | Render / Railway + Vercel | Backend, database, and frontend hosting |

## Project purpose

This system supports the full patient-care lifecycle:

- patient login and role-based access
- doctor verification and profile management
- appointment booking and slot handling
- pre-visit symptom intake and AI summaries
- doctor dashboard with visit notes and post-visit summaries
- admin approval / verification workflow
- notifications, reminders, and calendar syncing

## Stack decision

The project intentionally stays on the current Python + FastAPI stack and React + Vite frontend.

## Implementation notes

- Backend lives under the `backend/` folder
- Frontend lives under the `frontend/` folder
- API contracts are exposed through FastAPI OpenAPI docs
- Role-based access is enforced via JWT and RBAC checks
- AI output is used for intake and summary assistance, with safe fallback handling
- Email and Google Calendar integrations are treated as downstream service integrations

## Development flow

1. Start the backend API service
2. Start the frontend app
3. Use the FastAPI Swagger docs to inspect and validate endpoints
4. Confirm role-based access for patient, doctor, and admin flows
5. Test booking, profile, summary, and notifications flows end-to-end
