# SRM Academia Authentication Flow

**Status:** DISCOVERED — HTTP-based authentication viable

## Overview

SRM Academia (academia.srmist.edu.in) is a Zoho Creator-based portal that provides
attendance, marks, courses, timetable, and calendar data for SRM students.

## Authentication Endpoint

```
POST https://academia.srmist.edu.in/accounts/signin.ac
```

### Required Fields

| Field | Value |
|-------|-------|
| `username` | Full email (`user@srmist.edu.in`) |
| `password` | Student password |
| `client_portal` | `true` |
| `portal` | `10002227248` |
| `servicename` | `ZohoCreator` |
| `serviceurl` | `https://academia.srmist.edu.in/` |
| `is_ajax` | `true` |
| `grant_type` | `password` |
| `service_language` | `en` |

### Optional Fields (Captcha)

| Field | When |
|-------|------|
| `cdigest` | Returned when captcha is required |
| `captcha` | Student's captcha solution |

### Headers

```
Content-Type: application/x-www-form-urlencoded
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36
Origin: https://academia.srmist.edu.in
Referer: https://academia.srmist.edu.in/
```

## Response Format

### Success

```json
{
  "status": "success",
  "data": {
    "access_token": "...",
    "oauthorize_uri": "https://academia.srmist.edu.in/..."
  }
}
```

### Captcha Required

```json
{
  "status": "fail",
  "code": "HIP_REQUIRED",
  "message": "Verification required",
  "cdigest": "..."
}
```

### Concurrent Session

Returns HTML with a form to terminate existing session.

## Session Establishment

After receiving `access_token` and `oauthorize_uri`:

1. `GET {oauthorize_uri}&access_token={access_token}`
2. Follow redirects
3. Session established when `JSESSIONID` cookie is set

## Data Endpoints

| Page | URL |
|------|-----|
| Attendance/Marks | `{BASE_URL}/srm_university/academia-academic-services/page/My_Attendance` |
| Courses/Timetable | `{BASE_URL}/srm_university/academia-academic-services/page/My_Time_Table_2023_24` |
| Calendar | `{BASE_URL}/srm_university/academia-academic-services/page/Academic_Planner_2025_26_EVEN` |

## Session Cookies

Key cookies after authentication:
- `JSESSIONID` — Main session identifier
- `_iamadt_client_10002227248` — Client session
- `_iambdt_client_10002227248` — Browser session

## Security Notes

- Passwords are NEVER stored
- Session cookies are server-side only
- CAPTCHA challenges are passed to the student for manual solving
- No automated CAPTCHA solving
- Rate limiting respected
