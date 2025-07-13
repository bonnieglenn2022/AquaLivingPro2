# AquaLiving Pro - Pool & Outdoor Living Business Management System

## Overview

AquaLiving Pro is a comprehensive business management application specifically designed for pool and outdoor living contractors. It combines project management, CRM, estimating, scheduling, and reporting features into a single platform. The application uses a modern full-stack architecture with React frontend, Express.js backend, PostgreSQL database, and Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.
Auto-generate company slugs from company names instead of asking users to create them manually.
Remove Office Locations setup step to streamline the company creation process.
Single vCard import functionality: User prefers importing individual contacts from iPhone as vCard (.vcf) files rather than bulk imports or manual entry forms.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom pool/outdoor living theme colors
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: express-session with PostgreSQL store
- **API Design**: RESTful endpoints with consistent error handling
- **Middleware**: Custom logging, JSON parsing, and authentication guards

### Database Architecture
- **Database**: PostgreSQL (via Neon serverless)
- **ORM**: Drizzle ORM with type-safe queries
- **Schema**: Industry-specific tables for pool construction workflow
- **Migrations**: Drizzle Kit for schema management

## Key Components

### Authentication System
- **Provider**: Replit Auth integration with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions table
- **User Management**: User profiles with Replit claims integration
- **Authorization**: Route-level authentication guards

### Core Business Entities
- **Customers**: Lead and customer management with priority tracking
- **Projects**: Pool and outdoor living project lifecycle management
- **Estimates**: Detailed project estimation with line items
- **Tasks**: Project phase and task tracking
- **Equipment**: Pool equipment inventory and project assignment
- **Vendors**: Supplier and subcontractor management
- **Documents**: Project document storage and categorization
- **Change Orders**: Project modification tracking
- **Activities**: Audit trail and activity logging

### UI Component System
- **Design System**: shadcn/ui with pool industry theming
- **Layout**: Responsive sidebar navigation with mobile support
- **Color Scheme**: Pool-themed colors (pool-blue, ocean-teal, sunset-orange, etc.)
- **Icons**: Lucide React icons
- **Notifications**: Toast notifications for user feedback

## Data Flow

### Client-Server Communication
1. **API Layer**: RESTful endpoints under `/api` prefix
2. **Query Management**: TanStack Query for caching and synchronization
3. **Error Handling**: Centralized error handling with user-friendly messages
4. **Authentication Flow**: Session-based auth with automatic redirects

### Database Operations
1. **Connection**: Neon serverless PostgreSQL with connection pooling
2. **Queries**: Type-safe Drizzle ORM queries
3. **Transactions**: ACID compliance for data integrity
4. **Schema Evolution**: Migration-based schema management

### State Management
1. **Server State**: TanStack Query for API data caching
2. **Client State**: React hooks for local component state
3. **Form State**: React Hook Form for form management
4. **Authentication State**: Custom useAuth hook for user state

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless
- **Authentication**: Replit Auth service
- **Hosting**: Replit deployment platform

### Development Tools
- **Build**: Vite with React plugin
- **Type Checking**: TypeScript with strict mode
- **Code Quality**: ESLint and Prettier configurations
- **Development**: Hot module replacement and error overlays

### Third-Party Libraries
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS with PostCSS
- **Date Handling**: date-fns for date operations
- **Validation**: Zod for runtime type validation
- **Icons**: Lucide React icon library

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express backend
- **Hot Reloading**: Full-stack development with live updates
- **Database**: Shared development database via environment variables

### Production Build
- **Frontend**: Vite production build with static asset optimization
- **Backend**: esbuild compilation to ESM format
- **Assets**: Optimized bundle with code splitting

### Environment Configuration
- **Environment Variables**: DATABASE_URL, SESSION_SECRET, REPLIT_DOMAINS
- **Feature Flags**: Replit-specific development features
- **Error Handling**: Production error logging and monitoring

### Scalability Considerations
- **Database**: Serverless PostgreSQL with automatic scaling
- **Sessions**: Database-backed session storage for multi-instance support
- **Static Assets**: Optimized builds with efficient caching strategies
- **API Design**: Stateless design for horizontal scaling