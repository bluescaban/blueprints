# API Routes

This directory contains all API routes for the BluePrints application.

## Available Endpoints

### Health Check
- **Endpoint**: `GET /api/health`
- **Description**: Returns the API health status
- **Response**: JSON with status, timestamp, and service name

## Future Endpoints

The following API endpoints are planned for future development:

### FigJam/Figma Integration
- `POST /api/figjam/import` - Import FigJam data
- `GET /api/figjam/flows` - Get FigJam flows
- `POST /api/figma/import` - Import Figma designs

### Specifications
- `GET /api/specs` - List all specifications
- `GET /api/specs/:id` - Get specific specification
- `POST /api/specs` - Create new specification
- `PUT /api/specs/:id` - Update specification
- `DELETE /api/specs/:id` - Delete specification

### Mermaid Flows
- `GET /api/flows` - List all user flows
- `GET /api/flows/:id` - Get specific flow
- `POST /api/flows` - Create new flow
- `PUT /api/flows/:id` - Update flow
- `DELETE /api/flows/:id` - Delete flow
- `POST /api/flows/:id/export` - Export flow as Mermaid diagram

## Development

API routes use the Next.js App Router convention. Each route is defined in a `route.ts` file within its corresponding directory under `app/api/`.

Learn more: [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
