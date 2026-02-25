# SWP391 Backend

Spring Boot + SQL Server + JWT.

## Run (dev)

1) Ensure SQL Server is running and you have a database (e.g. `SWP391`).
2) Update credentials in `src/main/resources/application.yml`.
3) Run:

```bash
mvn spring-boot:run
```

## Auth

`POST /api/auth/login` with JSON:

```json
{ "account": "...", "password": "..." }
```

Set `Authorization: Bearer <token>` for subsequent calls.
