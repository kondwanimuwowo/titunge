# Initiate Transfer to Mobile Money

## HTTP Method & Path
**POST** `/transfers/mobile-money`

## Request Body Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| accountId | string | Yes | Your 36-character account uuid to debit |
| amount | number | Yes | Transfer amount |
| reference | string | Yes | Unique client reference. Only `-`, `.`, `_` and alphanumeric characters allowed |
| transferRecipientId | string | No | 36-character recipient UUID (alternative to phone/operator) |
| phone | string | No | Recipient phone number (use with operator if no transferRecipientId) |
| operator | string | No | Mobile operator enum: `airtel`, `mtn`, `tnm`, `zamtel` |
| country | string | No | Country code: `zm` (Zambia) or `mw` (Malawi) |
| narration | string | No | Transfer description |

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| status | boolean | Success indicator |
| message | string | Response message |
| data.id | string | Transfer transaction ID |
| data.amount | string | Transfer amount |
| data.fee | string | Transaction fee |
| data.currency | string | Currency code (e.g., ZMW) |
| data.status | string | Transfer status: `pending`, `successful`, or `failed` |
| data.lencoReference | string | Lenco's internal reference |
| data.creditAccount | object | Recipient details (type, accountName, phone, operator, country) |

## Example Request
```json
{
  "accountId": "b176cda5-7d97-4a3f-b4dd-ab0234e9e08c",
  "amount": 20.00,
  "reference": "ref-3",
  "phone": "0750000000",
  "operator": "zamtel",
  "country": "zm",
  "narration": "Transfer"
}
```

## Example Response (Success)
```json
{
  "status": true,
  "message": "",
  "data": {
    "id": "9525b4c6-502b-45be-90e1-81eb81a3f424",
    "amount": "20.00",
    "fee": "8.50",
    "currency": "ZMW",
    "status": "successful",
    "lencoReference": "240010002",
    "reference": "ref-3"
  }
}
```

## Key Constraints
- **Geographic scope**: Currently supporting only Malawi and Zambia
- **Duplicate prevention**: References must be unique per account
- **Reference format**: Alphanumeric plus hyphens, periods, underscores only
