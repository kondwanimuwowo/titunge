# Create Transfer Recipient (Bank Account)

## HTTP Method & Path
- **Method:** POST
- **Path:** `/transfer-recipients/bank-account`
- **Base URL:** `https://api.lenco.co/access/v2`

## Authentication
Bearer token in Authorization header (required)

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accountNumber` | string | Yes | Bank account number |
| `bankId` | string | Yes | Bank identifier |
| `country` | string | No | Country code (optional) |

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | boolean | Operation success indicator |
| `message` | string | Response message |
| `data.id` | string | Recipient identifier (UUID) |
| `data.type` | string | Type: "bank-account" |
| `data.currency` | string | Currency code (e.g., "ZMW") |
| `data.country` | string | Country code (e.g., "zm") |
| `data.details.type` | string | "bank-account" |
| `data.details.accountName` | string | Account holder name |
| `data.details.accountNumber` | string | Bank account number |
| `data.details.bank.id` | string | Bank ID |
| `data.details.bank.name` | string | Bank name |
| `data.details.bank.country` | string | Bank country code |

## Example Request
```json
{
  "accountNumber": "9130000000000",
  "bankId": "002",
  "country": "zm"
}
```

## Example Response (Success - 200)
```json
{
  "status": true,
  "message": "",
  "data": {
    "id": "d4f71d4a-eda4-4237-9976-5cbdc8a54cf3",
    "type": "bank-account",
    "currency": "ZMW",
    "country": "zm",
    "details": {
      "type": "bank-account",
      "accountName": "Beata Jean",
      "accountNumber": "9130000000000",
      "bank": {
        "id": "002",
        "name": "Absa Bank",
        "country": "zm"
      }
    }
  }
}
```

## Example Response (Error - 400)
```json
{
  "status": false,
  "message": "Account Details could not be verified",
  "data": null
}
```

## Notes
- The endpoint validates "Account Details" during processing, returning a 400 error if verification fails
- Bank and country information is automatically resolved based on the provided `bankId`
