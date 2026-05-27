# Dairy Flat Air

Online booking system for the 159.352 Assignment 2 brief.

## What It Does

- Search scheduled flights by origin, destination, and real calendar date range.
- Book seats on scheduled flights.
- Prevent bookings when a flight is full.
- Show an invoice after booking.
- Cancel a booking by booking reference.
- Find all booked flights for a passenger by email address.
- Store scheduled flights and bookings in MongoDB Atlas.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and fill in your MongoDB Atlas URI:

```bash
cp .env.example .env.local
```

3. Seed the database:

```bash
npm run seed
```

4. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Vercel Deployment

Add these environment variables in Vercel:

- `MONGODB_URI`
- `MONGODB_DB`

Then deploy the project. If the database is empty, the app automatically creates passenger and schedule data on the first search.

## Submission

Submit:

- The Vercel URL in the comments.
- A project archive excluding `node_modules` and hidden files.
- `AI_STATEMENT.md`.
