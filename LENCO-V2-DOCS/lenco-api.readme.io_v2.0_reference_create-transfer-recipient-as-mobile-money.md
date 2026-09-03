# Create Transfer Recipient (Mobile Money)

## Endpoint Details
- **HTTP Method:** POST
- **Path:** `/transfer-recipients/mobile-money`
- **Base URL:** `https://api.lenco.co/access/v2`
- **Authentication:** Bearer token in Authorization header

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| phone | string | Yes | Recipient's phone number |
| operator | string | Yes | Mobile network operator: `airtel`, `mtn`, or `zamtel` |
| country | string | No | Currently supports only `zm` (Zambia) |

## Response Fields (Success - 200)

| Field | Type | Description |
|-------|------|-------------|
| status | boolean | Always `true` for successful responses |
| message | string | Empty string on success |
| data.id | string | Unique recipient identifier |
| data.type | string | Always `mobile-money` |
| data.country | string | Country code (e.g., `zm`) |
| data.currency | string | Currency code (e.g., `ZMW`) |
| data.details.type | string | Always `mobile-money` |
| data.details.accountName | string | Recipient's verified account name |
| data.details.phone | string | Phone number provided |
| data.details.operator | string | Operator selected |

## Error Response (400)

| Field | Type |
|-------|------|
| status | false |
| message | Error description (e.g., "Account Details could not be verified") |
| data | null |

## Example Request
```json
{
  "phone": "0750000000",
  "operator": "zamtel",
  "country": "zm"
}
```

## Example Response
```json
{
  "status": true,
  "message": "",
  "data": {
    "id": "d6b6e00e-bdb6-43a6-a561-85b61496198e",
    "type": "mobile-money",
    "country": "zm",
    "currency": "ZMW",
    "details": {
      "type": "mobile-money",
      "accountName": "Beata Jean",
      "phone": "0750000000",
      "operator": "zamtel"
    }
  }
}
```

## Key Constraints
- Currently limited to Zambia (`zm`)
- Operator must be one of three supported networks
- Account details are verified during creation
