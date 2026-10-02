# Library API

A RESTful API for library management, featuring JWT authentication, loan tracking, automatic overdue fine calculation, and a reservation queue for unavailable books.

Built as a portfolio project, applying NestJS modular architecture, MongoDB data modeling, and real business logic (not just simple CRUDs).

## Features

- **Authentication** — registration and login with JWT, passwords hashed with bcrypt
- **Books** — full CRUD with available copy tracking
- **Loans** — business rules including due dates, availability checks, duplicate loan prevention, and automatic overdue fine calculation
- **Reservations** — automatic waiting queue for books with no available copies, activated automatically when a copy is returned
- **Interactive documentation** — Swagger/OpenAPI at `/api-docs`
- **Automated tests** — unit test coverage on the business logic layer (services)
- **Containerization** — application and database running via Docker Compose

## Tech Stack

- [NestJS](https://nestjs.com/) 11 + TypeScript
- [MongoDB](https://www.mongodb.com/) + Mongoose
- [Passport](https://www.passportjs.org/) + JWT
- [Swagger](https://swagger.io/) (OpenAPI)
- [Jest](https://jestjs.io/) for testing
- [Docker](https://www.docker.com/) + Docker Compose

## Data Model

```text
User -----< Loan >----- Book
              |
User -----< Reservation >----- Book
```

- A **Book** has total and available copy counts
- A **Loan** links a user to a book, with a due date and an automatically calculated fine
- A **Reservation** joins a queue when a book has no available copies, and is automatically activated once a copy is returned

## Getting Started

### Prerequisites
- [Docker](https://www.docker.com/) and Docker Compose
- (Optional, for running outside Docker) Node.js 20+

### With Docker (recommended)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/library-api.git
cd library-api

# Copy the environment variables file
cp .env.example .env

# Edit .env and set your own JWT_SECRET (any long random string)

# Start the application and database
docker compose up -d --build
```

The API will be available at `http://localhost:3000`, with interactive documentation at `http://localhost:3000/api-docs`.

### Without Docker (local development)

```bash
npm install

# Make sure you have MongoDB running locally (or adjust MONGODB_URI in .env)

npm run start:dev
```

## Running Tests

```bash
npm test
```

To see the coverage report:

```bash
npm run test:cov
```

Tests cover the business logic layer (services), where the most important validations and rules live: copy availability, duplicate loan prevention, fine calculation, and reservation queue activation.

## API Documentation

With the application running, visit `http://localhost:3000/api-docs` for interactive Swagger documentation, where you can test every endpoint directly from the browser.

### Main Endpoints

| Method | Route | Description | Auth Required |
|--------|-------|-------------|:---:|
| POST | `/auth/register` | Create an account | No |
| POST | `/auth/login` | Authenticate and receive a JWT token | No |
| GET | `/auth/profile` | Return the logged-in user's data | Yes |
| GET | `/books` | List all books | No |
| GET | `/books/:id` | Get a book's details | No |
| POST | `/books` | Register a new book | Yes |
| PATCH | `/books/:id` | Update a book | Yes |
| DELETE | `/books/:id` | Remove a book | Yes |
| POST | `/loans` | Borrow a book | Yes |
| GET | `/loans/my` | List the logged-in user's loans | Yes |
| PATCH | `/loans/:id/return` | Return a borrowed book | Yes |
| POST | `/reservations` | Reserve an unavailable book | Yes |
| GET | `/reservations/my` | List the logged-in user's reservations | Yes |
| PATCH | `/reservations/:id/cancel` | Cancel a reservation | Yes |

## Project Structure

```text
src/
  auth/           # Authentication: JWT, Passport strategy, guards
  users/          # Users
  books/          # Book catalog
  loans/          # Loans and fine calculation rules
  reservations/   # Reservation queue
  common/         # Shared filters and utilities
```