# Resolve Mobile Money Account

## HTTP Method & Path
**POST** `/resolve/mobile-money`

Base URL: `https://api.lenco.co/access/v2`

## Authentication
Bearer token in `Authorization` header (required)

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `phone` | string | Yes | Mobile phone number |
| `operator` | string | Yes | "mtn", "airtel", or "zamtel" |
| `country` | string | No | Currently supports only "zm" |

## Response Schema

| Field | Type | Notes |
|-------|------|-------|
| `status` | boolean | Success indicator |
| `message` | string | Response message |
| `data.type` | string | Always "mobile-money" |
| `data.accountName` | string | Resolved account holder name |
| `data.phone` | string | Mobile number |
| `data.operator` | string | Service operator |
| `data.country` | string | Country code |

## Example Request
```json
{
  "phone": "0961111111",
  "operator": "mtn",
  "country": "zm"
}
```

## Example Response (Success - 200)
```json
{
  "status": true,
  "message": "",
  "data": {
    "type": "mobile-money",
    "accountName": "Beata Jean",
    "phone": "0750000000",
    "operator": "zamtel",
    "country": "zm"
  }
}
```

## Example Response (Failure - 400)
```json
{
  "status": false,
  "message": "Account details was not found",
  "data": null
}
```

## Key Constraints
- Operator field limited to three options: MTN, Airtel, or Zamtel
- Country parameter currently restricted to Zambia ("zm")
- Returns 400 when account cannot be resolved

## Note for Titunge
Use before `POST /transfer-recipients/mobile-money` in the seller payout-profile form, so the seller sees their resolved account name and can confirm it's correct before it's saved as a recipient.
