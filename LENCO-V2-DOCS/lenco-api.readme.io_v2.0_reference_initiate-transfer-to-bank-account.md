# Initiate Transfer to Bank Account

## HTTP Method & Path
**POST** `/transfers/bank-account`

## Request Body Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| accountId | string | Yes | Your 36-character account uuid to debit |
| amount | number (double) | Yes | Transfer amount |
| reference | string | Yes | Unique client reference. Only `-`, `.`, `_` and alphanumeric characters allowed |
| transferRecipientId | string | No | 36-character transfer recipient uuid |
| accountNumber | string | No | Recipient account (use with bankId if no transferRecipientId) |
| bankId | string | No | Bank identifier (use with accountNumber if no transferRecipientId) |
| narration | string | No | Transfer description |
| country | string | No | Country code (e.g., `ng`, `zm`) |

## Response Fields

| Field | Type | Notes |
|-------|------|-------|
| status | boolean | Request success indicator |
| message | string | Response description |
| data.id | string | Transfer unique identifier |
| data.amount | string | Transferred amount |
| data.fee | string | Transaction fee charged |
| data.currency | string | Currency code |
| data.status | string | One of: `pending`, `successful`, `failed` |
| data.lencoReference | string | Internal tracking reference |
| data.initiatedAt | date-time | When transfer started |
| data.completedAt | date-time \| null | When transfer finished (null if pending) |
| data.reasonForFailure | string \| null | Failure explanation if applicable |

## Example Request
```json
{
  "accountId": "b176cda5-7d97-4a3f-b4dd-ab0234e9e08c",
  "amount": 20.00,
  "reference": "ref-3",
  "accountNumber": "9130000000000",
  "bankId": "002",
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
    "lencoReference": "240010002"
  }
}
```

## Example Error Response
```json
{
  "status": false,
  "message": "Duplicate reference",
  "data": null
}
```

## Key Constraints
- **Reference uniqueness**: References cannot be duplicated; the API rejects duplicate submissions
- **Fee deduction**: Transaction fees are calculated and deducted from transfers (K8.50 seen on a K20 transfer in the docs' own example, consistent with Titunge's quoted K8.50-K35 range)
- **Recipient identification**: Either provide `transferRecipientId` OR both `accountNumber` and `bankId`
