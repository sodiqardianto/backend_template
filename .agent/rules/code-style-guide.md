---
trigger: always_on
---

## 📋 Table of Contents

- [Architecture Rules](#-architecture-rules)
- [Coding Conventions](#-coding-conventions)
- [File & Folder Naming](#-file--folder-naming)
- [TypeScript Rules](#-typescript-rules)
- [API Design Rules](#-api-design-rules)
- [Database Rules](#-database-rules)
- [Error Handling Rules](#-error-handling-rules)
- [Git Commit Rules](#-git-commit-rules)

---

## 🏗️ Architecture Rules

### Layer Separation

```
┌─────────────────────────────────────────────────────────┐
│  Controller  │  HANYA handle HTTP request/response      │
├──────────────┼──────────────────────────────────────────┤
│  Service     │  HANYA berisi business logic             │
├──────────────┼──────────────────────────────────────────┤
│  Repository  │  HANYA berisi database operations        │
└──────────────┴──────────────────────────────────────────┘
```

### ✅ DO

```typescript
// Controller - hanya HTTP handling
getAll = asyncHandler(async (req, res) => {
  const data = await this.service.getAll();
  ApiResponse.success(res, data);
});

// Service - business logic
async createMenu(data) {
  if (await this.repository.findByPath(data.path)) {
    throw AppError.conflict("Path already exists");
  }
  return this.repository.create(data);
}

// Repository - database only
async findAll() {
  return prisma.menu.findMany({ orderBy: { order: "asc" } });
}
```

### ❌ DON'T

```typescript
// ❌ Jangan taruh business logic di controller
create = asyncHandler(async (req, res) => {
  const existing = await prisma.menu.findUnique({ where: { path: req.body.path } });
  if (existing) {
    return res.status(409).json({ error: "exists" });
  }
  // ...
});

// ❌ Jangan akses req/res di service
async createMenu(req, res) {
  // Service tidak boleh tahu tentang HTTP
}

// ❌ Jangan taruh business logic di repository
async create(data) {
  const existing = await prisma.menu.findUnique({ where: { path: data.path } });
  if (existing) throw new Error("exists"); // ❌ Ini harusnya di service
}
```

---

## 📝 Coding Conventions

### General

| Rule | Description |
|------|-------------|
| **Indentation** | 2 spaces |
| **Quotes** | Double quotes (`"`) |
| **Semicolons** | Required |
| **Line length** | Max 100 characters |
| **Trailing comma** | Required for multiline |

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Files** | kebab-case | `menu-controller.ts`, `app-error.ts` |
| **Classes** | PascalCase | `MenuController`, `AppError` |
| **Interfaces** | PascalCase dengan prefix `I` | `IMenuRepository`, `IMenuService` |
| **Functions** | camelCase | `createMenu`, `getNextOrder` |
| **Variables** | camelCase | `menuService`, `nextOrder` |
| **Constants** | SCREAMING_SNAKE_CASE | `MAX_RETRIES`, `DEFAULT_PAGE_SIZE` |
| **Types** | PascalCase | `CreateMenuInput`, `UpdateMenuInput` |

### Import Order

```typescript
// 1. Node.js built-in modules
import path from "path";

// 2. External packages
import express from "express";
import { z } from "zod";

// 3. Internal modules (absolute paths)
import { AppError } from "../../shared/errors/app-error.js";
import { ApiResponse } from "../../shared/utils/api-response.js";

// 4. Relative imports (same feature)
import { MenuService } from "./menu.service.js";
import type { CreateMenuInput } from "./menu.validation.js";
```

---

## 📁 File & Folder Naming

### Feature Module Structure

```
src/features/[feature-name]/
├── index.ts              # Export barrel file
├── [name].controller.ts  # HTTP handlers
├── [name].service.ts     # Business logic
├── [name].repository.ts  # Data access
├── [name].routes.ts      # Route definitions
└── [name].validation.ts  # Zod schemas
```

### Shared Module Structure

```
src/shared/
├── errors/
│   └── app-error.ts
├── middlewares/
│   ├── async-handler.ts
│   ├── error-handler.ts
│   └── validate.ts
└── utils/
    └── api-response.ts
```

### Naming Rules

| Type | Pattern | Example |
|------|---------|---------|
| Feature folder | Plural noun | `menus/`, `users/`, `orders/` |
| Controller | `[singular].controller.ts` | `menu.controller.ts` |
| Service | `[singular].service.ts` | `menu.service.ts` |
| Repository | `[singular].repository.ts` | `menu.repository.ts` |
| Routes | `[singular].routes.ts` | `menu.routes.ts` |
| Validation | `[singular].validation.ts` | `menu.validation.ts` |

---

## 🔷 TypeScript Rules

### Type Imports

Gunakan `import type` untuk type-only imports:

```typescript
// ✅ DO
import type { Request, Response } from "express";
import type { Menu } from "@prisma/client";
import type { CreateMenuInput } from "./menu.validation.js";

// ❌ DON'T - kecuali dipakai sebagai value juga
import { Menu } from "@prisma/client";
```

### Avoid `any`

```typescript
// ❌ DON'T
function processData(data: any) { }

// ✅ DO
function processData(data: unknown) { }
function processData<T>(data: T) { }
function processData(data: ProcessDataInput) { }
```

### Prefer Interface over Type untuk Objects

```typescript
// ✅ Prefer interface untuk object shapes
interface IMenuRepository {
  findAll(): Promise<Menu[]>;
  findById(id: string): Promise<Menu | null>;
}

// ✅ Use type untuk unions, intersections, atau simple types
type MenuStatus = "active" | "inactive";
type CreateMenuInput = z.infer<typeof createMenuSchema>;
```

### Return Types

Selalu definisikan return type untuk public methods:

```typescript
// ✅ DO
async findAll(): Promise<Menu[]> {
  return prisma.menu.findMany();
}

// ❌ DON'T - implicit return type
async findAll() {
  return prisma.menu.findMany();
}
```

---

## 🌐 API Design Rules

### REST Conventions

| Action | HTTP Method | Endpoint Pattern | Example |
|--------|-------------|------------------|---------|
| List all | GET | `/api/[resources]` | `GET /api/menus` |
| Get one | GET | `/api/[resources]/:id` | `GET /api/menus/123` |
| Create | POST | `/api/[resources]` | `POST /api/menus` |
| Update (full) | PUT | `/api/[resources]/:id` | `PUT /api/menus/123` |
| Update (partial) | PATCH | `/api/[resources]/:id` | `PATCH /api/menus/123` |
| Delete | DELETE | `/api/[resources]/:id` | `DELETE /api/menus/123` |
| Custom action | PATCH | `/api/[resources]/[action]` | `PATCH /api/menus/reorder` |

### Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Menu created successfully",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [...]
  }
}
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success (GET, PUT, PATCH, DELETE) |
| 201 | Created (POST) |
| 204 | No Content (DELETE with no response body) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (duplicate entry) |
| 422 | Validation Error |
| 500 | Internal Server Error |

---

## 🗄️ Database Rules

### Schema Naming

| Type | Convention | Example |
|------|------------|---------|
| Model name | PascalCase singular | `Menu`, `User`, `Order` |
| Table name | snake_case plural | `menus`, `users`, `orders` |
| Column name | camelCase | `parentId`, `createdAt` |
| Foreign key | `[related]Id` | `parentId`, `userId` |

### Schema Example

```prisma
model Menu {
  id         String   @id @default(uuid())
  title      String
  path       String   @unique
  parentId   String?
  parent     Menu?    @relation("MenuHierarchy", fields: [parentId], references: [id])
  children   Menu[]   @relation("MenuHierarchy")
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([parentId])
  @@map("menus")  // Table name in database
}
```

### Transaction Rules

Gunakan transaction untuk operasi yang membutuhkan atomicity:

```typescript
// ✅ DO - atomic operation
async create(data: CreateMenuInput): Promise<Menu> {
  return prisma.$transaction(async (tx) => {
    const lastMenu = await tx.menu.findFirst({ orderBy: { order: "desc" } });
    const nextOrder = (lastMenu?.order ?? 0) + 1;
    return tx.menu.create({ data: { ...data, order: nextOrder } });
  });
}

// ❌ DON'T - race condition possible
async create(data: CreateMenuInput): Promise<Menu> {
  const nextOrder = await this.getNextOrder();  // ← Read
  return prisma.menu.create({ data: { order: nextOrder } });  // ← Write (race!)
}
```

---

## ⚠️ Error Handling Rules

### Throw, Don't Return Errors

```typescript
// ✅ DO
async getMenuById(id: string): Promise<Menu> {
  const menu = await this.repository.findById(id);
  if (!menu) {
    throw AppError.notFound("Menu not found");
  }
  return menu;
}

// ❌ DON'T
async getMenuById(id: string): Promise<Menu | null | { error: string }> {
  const menu = await this.repository.findById(id);
  if (!menu) {
    return { error: "Menu not found" };  // ❌ Don't return error objects
  }
  return menu;
}
```

### Use AppError for Business Errors

```typescript
// ✅ Use factory methods
throw AppError.notFound("Menu not found");
throw AppError.conflict("Path already exists");
throw AppError.badRequest("Invalid parent ID");
throw AppError.validation("Invalid input");
throw AppError.unauthorized("Please login");
throw AppError.forbidden("Access denied");

// ❌ Don't throw generic Error
throw new Error("Something went wrong");
```

### Don't Catch in Controller/Service

```typescript
// ✅ DO - let asyncHandler catch errors
getById = asyncHandler(async (req, res) => {
  const menu = await menuService.getMenuById(req.params.id);
  ApiResponse.success(res, menu);
});

// ❌ DON'T - unnecessary try-catch
getById = asyncHandler(async (req, res) => {
  try {
    const menu = await menuService.getMenuById(req.params.id);
    ApiResponse.success(res, menu);
  } catch (error) {
    // ❌ This defeats the purpose of centralized error handling
    res.status(500).json({ error: error.message });
  }
});
```

---

## 📦 Git Commit Rules

### Commit Message Format

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code restructuring |
| `test` | Adding tests |
| `chore` | Build, config, dependencies |

### Examples

```bash
# Feature
feat(menus): add bulk reorder endpoint

# Fix
fix(menus): prevent race condition on order assignment

# Refactor
refactor(repository): use transaction for atomic operations

# Docs
docs: update README with architecture diagram

# Chore
chore(deps): upgrade prisma to v7.2.0
```

### Branch Naming

```
<type>/<short-description>

# Examples
feature/menu-reorder
fix/order-race-condition
refactor/centralize-error-handling
```

---

## 🔗 Related Documentation

- [README.md](./README.md) - Project overview dan setup
- [Prisma Docs](https://www.prisma.io/docs) - Database ORM
- [Zod Docs](https://zod.dev) - Validation library
- [Express Docs](https://expressjs.com) - Web framework
