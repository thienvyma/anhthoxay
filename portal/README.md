# Portal - Nội Thất Nhanh

Portal application for Homeowners and Contractors in the bidding marketplace.

## Features

- **Homeowner Dashboard**: Manage projects, view bids, select contractors
- **Contractor Dashboard**: Browse marketplace, submit bids, manage profile
- **Public Marketplace**: View open projects (limited info)
- **Contractor Directory**: Browse verified contractors

## Development

```bash
# Start development server
pnpm dev:portal

# Or using nx
pnpm nx serve portal
```

The app runs on port **4203**.

## Routes

### Public Routes
- `/` - Public marketplace
- `/marketplace` - Public marketplace
- `/contractors` - Contractor directory
- `/auth/login` - Login page
- `/auth/register` - Registration page

### Homeowner Routes (Protected)
- `/homeowner` - Dashboard
- `/homeowner/projects` - My projects
- `/homeowner/projects/new` - Create project
- `/homeowner/projects/:id` - Project detail

### Contractor Routes (Protected)
- `/contractor` - Dashboard
- `/contractor/marketplace` - Browse projects
- `/contractor/my-bids` - My bids
- `/contractor/profile` - Profile management

## Tech Stack

- React 19
- React Router 7
- TanStack Query
- Framer Motion
- Tailwind CSS
- TypeScript
