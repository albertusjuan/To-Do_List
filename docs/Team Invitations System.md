# Team Member Invitation System

## Overview
This system allows team owners to invite members via email, with configurable team size limits. It includes invitation tracking, status management, and automatic expiration.

---

## Features

### 1. Team Member Limits
- Set max members (1-100) when creating a team
- Real-time display of current vs. max members
- Prevents adding members beyond the limit
- Shows available slots

### 2. Email Invitations
- Invite members by email address
- Track invitation status (pending/accepted/rejected)
- Auto-expire invitations after 7 days
- Cancel pending invitations

### 3. Member Management
- View all team members with roles
- Display member emails
- Show owner vs. member roles
- Track join dates

---

## Database Schema

### Updated `teams` Table
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  max_members INTEGER DEFAULT 10 NOT NULL CHECK (max_members >= 1 AND max_members <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Updated `team_members` Table
```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT, -- Added for display
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);
```

### New `team_invitations` Table
```sql
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE(team_id, email)
);
```

---

## API Endpoints

### Teams

**GET /api/teams/:id/members**
- Returns all members of a team
- Response: `{ success: true, data: TeamMember[] }`

**GET /api/teams/:id/invitations**
- Returns all invitations for a team
- Response: `{ success: true, data: TeamInvitation[] }`

**POST /api/teams/:id/invite**
- Send invitation to email address
- Body: `{ email: string }`
- Validates:
  - Team has available slots
  - Email not already invited/member
  - Sender is team owner
- Response: `{ success: true, data: TeamInvitation }`

**DELETE /api/teams/invitations/:id**
- Cancel a pending invitation
- Requires: Owner of the team
- Response: `{ success: true }`

### Member Operations

**POST /api/teams/invitations/:id/accept**
- Accept invitation (creates team_member)
- Requires: Email matches current user
- Response: `{ success: true, data: TeamMember }`

**POST /api/teams/invitations/:id/reject**
- Reject invitation
- Requires: Email matches current user
- Response: `{ success: true }`

---

## Frontend Components

### TeamsView Component

**State Management:**
```typescript
const [teams, setTeams] = useState<Team[]>([]);
const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>({});
const [teamInvitations, setTeamInvitations] = useState<Record<string, TeamInvitation[]>>({});
const [invitingTeamId, setInvitingTeamId] = useState<string | null>(null);
const [inviteEmail, setInviteEmail] = useState('');
```

**Key Functions:**
- `fetchTeamMembers(teamId)` - Load members for a team
- `fetchTeamInvitations(teamId)` - Load invitations for a team
- `handleInviteMember(teamId)` - Send invitation
- `handleCancelInvitation(invitationId, teamId)` - Cancel invitation

---

## User Interface

### Team Creation Form
```
┌─────────────────────────────────────┐
│ Team Name: [________________]       │
│ Max Members: [10]                   │
│ Description: [_________________]    │
│                                     │
│ [Create Team]                       │
└─────────────────────────────────────┘
```

### Team Card Display
```
┌─────────────────────────────────────┐
│ Team Name             [3 / 10]      │
│ Description text here               │
│                                     │
│ MEMBERS                             │
│ • owner@example.com    [OWNER]      │
│ • member1@example.com  [MEMBER]     │
│ • member2@example.com  [MEMBER]     │
│                                     │
│ PENDING INVITATIONS                 │
│ • invited@example.com  [Cancel]     │
│                                     │
│ [+ Invite Member (7 slots left)]    │
│                                     │
│ [Copy ID] [Delete]                  │
└─────────────────────────────────────┘
```

### Invitation Form
```
┌─────────────────────────────────────┐
│ [email@example.com___________]      │
│ [Send]  [Cancel]                    │
└─────────────────────────────────────┘
```

---

## Business Logic

### Member Limit Enforcement

**Database Trigger:**
```sql
CREATE TRIGGER enforce_team_member_limit
  BEFORE INSERT ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION check_team_member_limit();
```

Prevents adding members if:
- Current count >= max_members
- Raises exception with error message

### Invitation Validation

**Backend Checks:**
1. Team has available slots
2. Email not already a member
3. No pending invitation for this email
4. Sender is team owner
5. Valid email format

**Frontend Validation:**
- Email format regex
- Immediate feedback
- Shows available slots

### Auto-Expiration

**Function:**
```sql
CREATE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE team_invitations
  SET status = 'rejected'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

**Scheduled:**
- Run via cron job or scheduled task
- Runs daily at midnight
- Updates all expired invitations

---

## Security

### Row Level Security (RLS)

**team_invitations Policies:**

1. **View Invitations:**
   - Users can see invitations sent to their email
   - Team owners can see all invitations for their teams

2. **Create Invitations:**
   - Only team owners can create invitations

3. **Update Invitations:**
   - Users can accept/reject their own invitations

4. **Delete Invitations:**
   - Only team owners can cancel invitations

### API Authorization

**Required Checks:**
- User is authenticated
- User has appropriate role
- Team exists and is accessible
- Email validation

---

## User Flows

### Flow 1: Create Team with Limit

1. User clicks "New Team"
2. Fills in name, description, max_members
3. Submits form
4. Team created with specified limit
5. User becomes owner (first member)

### Flow 2: Invite Member

1. Owner clicks "Invite Member"
2. Enters email address
3. System validates:
   - Email format
   - Available slots
   - No duplicate invitation
4. Invitation sent
5. Email appears in "Pending Invitations"

### Flow 3: Accept Invitation

1. User receives invitation email (future feature)
2. Clicks invitation link
3. Logs in if needed
4. Views invitation details
5. Clicks "Accept"
6. Added to team as member
7. Invitation status updated to "accepted"

### Flow 4: Team Full

1. Team reaches max_members limit
2. "Invite Member" button disabled
3. Shows "Team is full" message
4. Owner can:
   - Remove members to free slots
   - Increase max_members (if allowed)

---

## Styling

### Member Count Badge
```css
.member-count-badge {
  background: #f1f5f9;
  color: #475569;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
}
```

### Role Badges
```css
.member-role.owner {
  background: #dbeafe;
  color: #1e40af;
}

.member-role.member {
  background: #f1f5f9;
  color: #64748b;
}
```

### Team Full Indicator
```css
.team-full-text {
  color: #ef4444;
  background: #fef2f2;
  border: 1px solid #fecaca;
}
```

---

## Error Handling

### Frontend Errors

**Empty Email:**
```typescript
if (!inviteEmail.trim()) {
  alert('Please enter an email address');
  return;
}
```

**Invalid Email:**
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(inviteEmail)) {
  alert('Please enter a valid email address');
  return;
}
```

### Backend Errors

**Team Full:**
```
{ success: false, message: 'Team has reached maximum member limit' }
```

**Already Invited:**
```
{ success: false, message: 'User already invited or is a member' }
```

**Not Owner:**
```
{ success: false, message: 'Only team owners can invite members' }
```

---

## Testing Checklist

### Manual Testing

- [ ] Create team with max_members = 5
- [ ] Invite 4 members (should succeed)
- [ ] Try to invite 5th member (should fail - owner counts)
- [ ] Cancel pending invitation
- [ ] Re-invite same email
- [ ] Try to invite existing member (should fail)
- [ ] Try to invite with invalid email (should fail)
- [ ] Accept invitation (creates member)
- [ ] Verify member count updates
- [ ] Verify "Team is full" message appears
- [ ] Delete member, verify slots available
- [ ] Invitation expires after 7 days

### Edge Cases

- [ ] Max_members = 1 (owner only)
- [ ] Max_members = 100 (maximum)
- [ ] Simultaneous invitations from different owners
- [ ] Delete team with pending invitations
- [ ] Owner leaves team (should prevent if only owner)

---

## Future Enhancements

### 1. Email Notifications
- Send actual invitation emails
- Include accept/reject links
- Reminder emails before expiration

### 2. Invitation Links
- Generate unique invitation URLs
- One-click accept via link
- Shareable invitation codes

### 3. Bulk Invitations
- Upload CSV of emails
- Invite multiple at once
- Progress tracking

### 4. Member Permissions
- Fine-grained role permissions
- Custom roles beyond owner/member
- Per-feature access control

### 5. Team Size Management
- Allow owners to increase max_members
- Pricing tiers based on team size
- Team analytics and usage stats

### 6. Member Removal
- Remove members from team
- Block/unblock members
- Transfer ownership

---

## Migration Instructions

### Step 1: Run SQL Migration

```bash
# Connect to your Supabase project
psql YOUR_DATABASE_URL < database/migrations/add_team_invitations.sql
```

### Step 2: Verify Tables

```sql
-- Check teams table has max_members
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'teams';

-- Check team_invitations exists
SELECT * FROM team_invitations LIMIT 1;
```

### Step 3: Update Existing Teams

```sql
-- Set default max_members for existing teams
UPDATE teams
SET max_members = 10
WHERE max_members IS NULL;
```

### Step 4: Deploy Frontend

```bash
# Deploy updated frontend with new components
npm run build
# Deploy to your hosting platform
```

---

## Related Files

### Frontend
- `frontend/src/types/database.types.ts` - TypeScript interfaces
- `frontend/src/components/TeamsView.tsx` - Main teams UI
- `frontend/src/components/TeamsView.css` - Teams styling

### Backend
- `database/migrations/add_team_invitations.sql` - Database schema
- Backend API endpoints (to be implemented)

### Documentation
- `docs/Teams Management.md` - Core teams documentation
- `docs/Team Invitations System.md` - This file

---

## Conclusion

The Team Invitation System provides a robust, secure, and user-friendly way to manage team membership with configurable size limits. With proper validation, RLS policies, and a clean UI, users can easily collaborate while maintaining control over team composition.

