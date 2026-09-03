# Get Transfer by Reference (Transfer Status)

## HTTP Method & Path
**GET** `/transfers/status/{reference}`

## Base URL
`https://api.lenco.co/access/v2`

## Authentication
Bearer token in Authorization header (required)

## Path Parameter
- **reference** (string, required): The reference identifier used when initiating the transfer

## Response Fields & Types

### Root Level
- **status** (boolean): Request success indicator
- **message** (string): Response message
- **data** (object): Transfer details

### Data Object
- **id** (string): Unique transfer identifier
- **amount** (string): Transfer amount
- **fee** (string): Transaction fee
- **currency** (string): Currency code (e.g., "ZMW")
- **narration** (string): Transaction description
- **initiatedAt** (date-time): Timestamp when transfer started
- **completedAt** (date-time | null): Completion timestamp or null if pending
- **accountId** (string): Originating account ID
- **status** (enum): "pending" | "successful" | "failed"
- **reasonForFailure** (string | null): Failure explanation if applicable
- **reference** (string | null): Original reference provided
- **lencoReference** (string): Internal transaction identifier
- **source** (string): Origin of transfer request

### Credit Account Object
- **type** (string): Account type (e.g., "bank-account")
- **accountName** (string): Recipient name
- **accountNumber** (string | null): Recipient account number
- **bank** (object | null): Bank details with id, name, country
- **phone** (string | null): Phone number for mobile transfers
- **operator** (string | null): Mobile operator identifier
- **walletNumber** (string | null): Wallet identifier
- **tillNumber** (string | null): Till number for merchant accounts

### Extra Data Object
- **nipSessionId** (string | null): NIP session identifier

## HTTP Status Codes
- **200**: Successful transfer retrieval
- **404**: Transfer not found; returns "Transfer was not found"

## Example
Transfer for 20.00 ZMW completed successfully to Beata Jean at Absa Bank with fee of 8.50 ZMW, internal reference "240010002".

## Note for Titunge's process-payouts/verify-payouts crons
This is the single source of truth for a transfer's real status — same defense-in-depth rule as collections: never trust a webhook payload alone, always re-fetch this endpoint before flipping `marketplace_order_payouts.payout_status`.
