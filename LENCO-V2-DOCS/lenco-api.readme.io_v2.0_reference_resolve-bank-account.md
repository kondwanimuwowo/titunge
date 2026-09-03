# Resolve Bank Account

## HTTP Method & Path
- **Method:** POST
- **Path:** `/resolve/bank-account`
- **Base URL:** `https://api.lenco.co/access/v2`

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| accountNumber | string | Yes | The bank account number to verify |
| bankId | string | Yes | Identifier for the bank |
| country | string | No | Optional country code (e.g., `ng`, `zm`) |

## Response Fields

| Field | Type | Notes |
|-------|------|-------|
| status | boolean | Success indicator |
| message | string | Response message |
| data | object | Contains resolved account details (null on error) |
| data.type | string | Always "bank-account" |
| data.accountName | string | Name associated with the account |
| data.accountNumber | string | The verified account number |
| data.bank.id | string | Bank identifier |
| data.bank.name | string | Bank name |
| data.bank.country | string | Country code |

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
```

## Example Response (Error - 400)
```json
{
  "status": false,
  "message": "Account details was not found",
  "data": null
}
```

## Authentication
Bearer token required in Authorization header.

## Note for Titunge
Use before `POST /transfer-recipients/bank-account` in the seller payout-profile form, so the seller sees their resolved account name and can confirm it's correct before it's saved as a recipient.
