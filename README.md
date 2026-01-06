# Backend Template

A clean, scalable Node.js backend template built with **Express.js**, **TypeScript**, and **Prisma 7** following modern software architecture principles.

## 🏗️ Architecture Overview

This project implements **Clean Architecture** (also known as Layered Architecture) with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                         HTTP Layer                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │    Routes       │→ │   Middleware    │→ │   Controller    │  │
│  │ (Endpoints)     │  │ (Validation)    │  │ (HTTP Handler)  │  │
│  └─────────────────┘  └─────────────────┘  └────────┬────────┘  │
└──────────────────────────────────────────────────────┼──────────┘
                                                       │
                                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Business Layer                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Service                                   │ │
│  │              (Business Logic + Validation)                   │ │
│  └──────────────────────────────┬──────────────────────────────┘ │
└─────────────────────────────────┼───────────────────────────────┘
                                  │ Interface (Contract)
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Data Layer                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Repository                                │ │
│  │                 (Database Operations)                        │ │
│  └──────────────────────────────┬──────────────────────────────┘ │
└─────────────────────────────────┼───────────────────────────────┘
                                  │
                                  ▼
                         ┌───────────────┐
                         │  PostgreSQL   │
                         │  (via Prisma) │
                         └───────────────┘
```

## 📁 Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── prisma.config.ts           # Prisma 7 configuration
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── server.ts              # Server entry point
│   ├── config/
│   │   └── database.ts        # Prisma client singleton
│   ├── features/
│   │   └── menus/             # Feature module
│   │       ├── index.ts       # Module exports
│   │       ├── menu.controller.ts
│   │       ├── menu.service.ts
│   │       ├── menu.repository.ts
│   │       ├── menu.routes.ts
│   │       └── menu.validation.ts
│   └── shared/
│       ├── errors/
│       │   └── app-error.ts   # Custom error class
│       ├── middlewares/
│       │   ├── async-handler.ts
│       │   ├── error-handler.ts
│       │   └── validate.ts
│       └── utils/
│           └── api-response.ts
├── package.json
└── tsconfig.json
```

## 🎯 Design Patterns

### 1. Repository Pattern

Abstracts data access logic, separating database operations from business logic.

```typescript
// menu.repository.ts
export interface IMenuRepository {
  findAll(): Promise<Menu[]>;
  findById(id: string): Promise<Menu | null>;
  create(data: CreateMenuInput): Promise<Menu>;
  update(id: string, data: UpdateMenuInput): Promise<Menu>;
  delete(id: string): Promise<Menu>;
}

export class MenuRepository implements IMenuRepository {
  async findAll(): Promise<Menu[]> {
    return prisma.menu.findMany({ orderBy: { order: "asc" } });
  }
}
```

### 2. Service Layer Pattern

Contains all business logic, validation rules, and orchestration between repositories.

```typescript
// menu.service.ts
export class MenuService implements IMenuService {
  constructor(private readonly repository: IMenuRepository) {}

  async createMenu(data: CreateMenuInput): Promise<Menu> {
    // Business rule: Check for duplicate path
    const existingMenu = await this.repository.findByPath(data.path);
    if (existingMenu) {
      throw AppError.conflict(`Menu with path "${data.path}" already exists`);
    }
    return this.repository.create(data);
  }
}
```

### 3. Dependency Injection

Loose coupling between layers using constructor injection and factory functions.

```typescript
// Factory function for DI
export function createMenuService(repository: IMenuRepository): IMenuService {
  return new MenuService(repository);
}

// Usage in controller
const menuService = createMenuService(menuRepository);
```

### 4. Singleton Pattern

Single instance of critical resources (Prisma client, repositories, controllers).

```typescript
// config/database.ts
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

// menu.repository.ts
export const menuRepository = new MenuRepository();
```

### 5. Middleware Pattern

Cross-cutting concerns (validation, error handling) implemented as middleware.

```typescript
// Route with validation middleware
router.post(
  "/",
  validate({ body: createMenuSchema }),
  menuController.create
);
```

## ⚠️ Error Handling

This project uses **Centralized Error Handling** pattern - no try-catch blocks scattered throughout the codebase.

### Error Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Request → Controller → Service → Repository                     │
│              │            │           │                          │
│              │      throw AppError    │    Prisma Error          │
│              │            │           │         │                │
│              └────────────┴───────────┴─────────┘                │
│                           │                                      │
│                           ▼                                      │
│              ┌───────────────────────┐                          │
│              │    asyncHandler()     │  ← Catches all errors    │
│              │   .catch(next)        │                          │
│              └───────────┬───────────┘                          │
│                          │                                       │
│                          ▼                                       │
│              ┌───────────────────────┐                          │
│              │   errorHandler()      │  ← Formats response      │
│              │   (Global Middleware) │                          │
│              └───────────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

### Components

#### 1. AppError - Custom Error Class

```typescript
// Throw business logic errors
throw AppError.notFound("Menu not found");
throw AppError.conflict("Path already exists");
throw AppError.badRequest("Invalid parent ID");
throw AppError.validation("Invalid input");
```

#### 2. asyncHandler - Async Wrapper

Automatically catches errors from async route handlers and forwards to error handler.

```typescript
// No try-catch needed in controller!
getAll = asyncHandler(async (_req: Request, res: Response) => {
  const menus = await menuService.getAllMenus();
  ApiResponse.success(res, menus, "Menus retrieved successfully");
});
```

#### 3. errorHandler - Global Error Middleware

Handles all error types and returns consistent response format:

| Error Type | Handling |
|------------|----------|
| `ZodError` | 422 - Validation error with field details |
| `AppError` | Custom status code and message |
| `PrismaClientKnownRequestError` | P2002 → 409, P2025 → 404 |
| Unknown errors | 500 - Internal server error |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "title", "message": "Title is required" },
      { "field": "path", "message": "Path must start with /" }
    ]
  }
}
```

## ✅ API Response Format

All responses follow a consistent structure using `ApiResponse` utility:

### Success Response

```json
{
  "success": true,
  "message": "Menus retrieved successfully",
  "data": [...]
}
```

### Paginated Response

```json
{
  "success": true,
  "message": "Success",
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## 🔐 Validation

Request validation uses **Zod** schemas with middleware integration:

```typescript
// menu.validation.ts
export const createMenuSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  path: z.string().min(1).regex(/^\//, "Path must start with /"),
  icon: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
  permission: z.string().optional(),
  isActive: z.boolean().default(true),
});

// menu.routes.ts
router.post("/", validate({ body: createMenuSchema }), menuController.create);
```

## 🗄️ Database (Prisma 7)

This project uses **Prisma 7** with the new driver adapter pattern:

### Configuration

```typescript
// prisma.config.ts - Prisma 7 style
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});

// config/database.ts - Driver adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
```

### Transaction for Race Conditions

Critical operations use Prisma transactions to prevent race conditions:

```typescript
async create(data: CreateMenuInput): Promise<Menu> {
  return prisma.$transaction(async (tx) => {
    const lastMenu = await tx.menu.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const nextOrder = (lastMenu?.order ?? 0) + 1;

    return tx.menu.create({
      data: { ...data, order: nextOrder },
    });
  });
}
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL (via Docker or local)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Start development server
npm run dev
```

### Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:studio` | Open Prisma Studio |

## 📚 API Endpoints

### Menus

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menus` | Get all menus |
| GET | `/api/menus/:id` | Get menu by ID |
| POST | `/api/menus` | Create new menu |
| PUT | `/api/menus/:id` | Update menu |
| DELETE | `/api/menus/:id` | Delete menu |
| PATCH | `/api/menus/reorder` | Bulk reorder menus |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health status |

## 🛡️ Graceful Shutdown

The server handles SIGINT and SIGTERM signals for graceful shutdown:

```typescript
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

## 🧩 Adding New Features

To add a new feature module, follow this structure:

```
src/features/[feature-name]/
├── index.ts              # Module exports
├── [name].controller.ts  # HTTP handlers
├── [name].service.ts     # Business logic
├── [name].repository.ts  # Data access
├── [name].routes.ts      # Route definitions
└── [name].validation.ts  # Zod schemas
```

Then register routes in `app.ts`:

```typescript
import { newFeatureRoutes } from "./features/[feature-name]/index.js";
app.use("/api/[feature-name]", newFeatureRoutes);
```

## 📋 SOLID Principles Applied

| Principle | Implementation |
|-----------|----------------|
| **S**ingle Responsibility | Each layer has one job (Controller → HTTP, Service → Business, Repository → Data) |
| **O**pen/Closed | Interfaces allow extension without modification |
| **L**iskov Substitution | Repository implementations are interchangeable |
| **I**nterface Segregation | Small, focused interfaces (`IMenuRepository`, `IMenuService`) |
| **D**ependency Inversion | High-level modules depend on abstractions, not implementations |

## 🔧 Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| TypeScript | 5.x | Type safety |
| Express | 4.x | Web framework |
| Prisma | 7.x | ORM |
| PostgreSQL | 15+ | Database |
| Zod | 3.x | Validation |
| tsx | 4.x | Development server |

---

Built with ❤️ using Clean Architecture principles.
