# Get Banks

**HTTP Method:** GET

**Path:** `/banks`

**Base URL:** `https://api.lenco.co/access/v2`

**Authentication:** Bearer token in Authorization header

## Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| country | string | Optional. Country code (e.g., "ng" for Nigeria, "zm" for Zambia) |

## Response Schema

| Field | Type | Description |
|-------|------|-------------|
| status | boolean | Indicates successful request |
| message | string | Response message |
| data | array | List of banks/financial institutions |
| data[].id | string | Bank identifier code |
| data[].name | string | Bank name |
| data[].country | string | Country code |

## Example Response

```json
{
    "status": true,
    "message": "",
    "data": [
        {
            "id": "002",
            "name": "Absa Bank",
            "country": "zm"
        }
    ]
}
```

## Note for Titunge
Used to populate the bank dropdown in the seller payout-profile form
(`src/lib/lenco.ts::listBanks()`), fetched live at request time rather than
hardcoded — Lenco's bank list/codes are the source of truth, not guessed.
