# Intensia Admin Pro - Updated Structure

## Overview
The application has been refactored with proper code splitting and component organization. The system now supports three main portals:

1. **Admin Hub** - Manage programs, view participants, and oversee the festival
2. **Green Room** - Verify participant identity and allocate programs to judges
3. **Team Leader Portal** - Register participants for programs with proper limits

## New File Structure

```
Intensia-admin-pro/
├── src/
│   ├── pages/
│   │   ├── AdminPage.tsx           # Admin dashboard & program management
│   │   ├── GreenRoomPage.tsx       # Green room operations
│   │   └── TeamLeaderPage.tsx      # Team leader registration portal
│   ├── components/
│   │   ├── MetricsCard.tsx         # Statistics display card
│   │   ├── ProgramAccordion.tsx    # Expandable program card
│   │   ├── ProgramList.tsx         # Program listing with filters
│   │   ├── ParticipantList.tsx     # Participant database
│   │   ├── AIInsights.tsx          # AI-powered insights
│   │   ├── ProgramFormModal.tsx    # Add/edit program modal
│   │   ├── GreenRoomProgramCard.tsx        # Green room program card
│   │   └── ParticipantRegistrationForm.tsx #  Team participant registration
│   ├── services/
│   │   └── geminiService.ts        # AI integration
│   ├── types.ts                    # TypeScript interfaces
│   └── constants.ts                # Mock data
├── App.tsx                         # Main application with routing
└── index.tsx                       # Application entry point
```

## Key Features

### Team Leader Portal

#### Authentication
Two team leaders can access their respective portals:
- **Team 1**: Username: `team1`, Password: `team1pass`
- **Team 2**: Username: `team2`, Password: `team2pass`

#### Registration Limits
The system enforces the following participation limits:

1. **Normal Programs (Stage and Non-Stage)**:
   - Maximum of **4 programs** per participant
   - This limit applies to all non-general category programs

2. **General Programs**:
   - **Unlimited** participation allowed
   - No restrictions on the number of programs

#### Features
- View all published programs
- Register participants with automatic limit validation
- Remove participants from programs
- View team statistics and participant history
- Track individual participant program counts

### Admin Hub
- Create and manage programs
- View comprehensive statistics
- Access participant database
- AI-generated festival insights
- Publish program results

### Green Room
- View programs in chronological order
- Scratch and reveal participant codes
- Verify participant identityAllocate programs to judge terminals

## How to Use

### For Team Leaders

1. Click on "Team Leader" tab in the navigation
2. Login with your credentials
3. Browse available published programs
4. Click "+ Add" to register a participant
5. System will automatically prevent registration if limits are exceeded
6. View your team's registered participants and program counts

### For Administrators

1. Use "Admin Hub" to manage programs  
2. Publish programs to make them available for team leaders
3. Monitor participant registrations
4. View AI insights about festival progress

### For Green Room Staff

1. Use "Green Room" tab
2. Scratch codes to verify participant identity
3. Allocate completed programs to judge terminals

## Program Categories

- **A zone stage** - Stage programs (counts towards 4-program limit)
- **A zone no stage** - Non-stage programs (counts towards 4-program limit)
- **A zone general stage** - General stage programs (unlimited)
- **A zone general non stage** - General non-stage programs (unlimited)

## Technical Details

### Participant Limit Logic
The system differentiates between program types:
- Programs with "general" in the category name are unlimited
- All other programs count towards the 4-program maximum
- Validation occurs before adding a participant to ensure limits aren't exceeded

### State Management
- Programs are managed at the App level and passed down to pages
- Each portal maintains its own view state
- Authentication state persists during the session

## Running the Application

```bash
npm install
npm run dev
```

The application will start on `http://localhost:5173/`

## Future Enhancements

- Persist authentication using localStorage
- Add backend API integration
- Implement real-time updates using WebSockets
- Add export functionality for participant data
- Enhanced reporting and analytics
