# How to Add People to Your Team

## 🚀 Quick Steps

### 1. Switch to TeamDO Mode
Click the mode toggle button at the top:
```
TODO. → TeamDO.
```

### 2. Open Teams View
Click the **Teams** button (appears next to List and Calendar when in TeamDO mode)

### 3. Invite Members
For the team you want to add people to:
1. Click **"+ Invite Member (X slots left)"**
2. Enter the person's email address
3. Click **"Send"**

✅ Done! They'll receive an invitation.

---

## 📍 Location in the App

```
Main Page
  └─ Mode Toggle [TODO. ←→ TeamDO.]
       └─ Switch to TeamDO mode
            └─ View Toggle [List] [Calendar] [Teams]
                 └─ Click Teams
                      └─ Find your team card
                           └─ Click "+ Invite Member"
                                └─ Enter email
                                     └─ Click Send
```

---

## 🎯 What You'll See

### **TeamDO Mode (Teams View)**

```
┌──────────────────────────────────────────┐
│ Your Teams                  [+ New Team] │
├──────────────────────────────────────────┤
│                                          │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ Marketing Team          [2 / 10]   ┃ │
│ ┃ Handle all marketing tasks         ┃ │
│ ┃                                     ┃ │
│ ┃ ▼ MEMBERS                          ┃ │
│ ┃ • john@company.com    [OWNER]      ┃ │
│ ┃ • sarah@company.com   [MEMBER]     ┃ │
│ ┃                                     ┃ │
│ ┃ ▼ PENDING INVITATIONS              ┃ │
│ ┃ • invited@company.com  [Cancel]    ┃ │
│ ┃                                     ┃ │
│ ┃ ┌────────────────────────────────┐ ┃ │
│ ┃ │ + Invite Member (7 slots left) │ ┃ │ ← Click Here!
│ ┃ └────────────────────────────────┘ ┃ │
│ ┃                                     ┃ │
│ ┃ [Copy ID]  [Delete]                ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
└──────────────────────────────────────────┘
```

### **After Clicking "Invite Member"**

```
┌────────────────────────────────────┐
│ [email@example.com___________]     │ ← Type email here
│ [Send]  [Cancel]                   │ ← Click Send
└────────────────────────────────────┘
```

---

## ✅ Requirements

### **To Invite Members:**
1. ✅ You must be in **TeamDO mode**
2. ✅ You must be the **team owner**
3. ✅ Team must have **available slots** (not full)
4. ✅ Valid email address required

### **Team Size Limits:**
- Each team has a **max_members** limit (set when creating team)
- Default: **10 members**
- Range: **1-100 members**
- Owner counts as 1 member

---

## 💡 Features

### **View Member Status**
- **Owner** badge - Team creator/owner
- **Member** badge - Regular team member
- Shows member email addresses

### **Track Invitations**
- See pending invitations
- Cancel invitations if needed
- Invitation expires after 7 days

### **Member Count**
Shows current members vs. max:
```
[3 / 10]  ← 3 current, 10 maximum
```

### **Available Slots**
Button shows how many people you can still invite:
```
+ Invite Member (7 slots left)
```

### **Team Full**
When team reaches max capacity:
```
🔴 Team is full
```
Invite button disappears.

---

## 🔧 Creating a Team with Custom Size

When creating a new team, you can set the max members:

1. Click **"+ New Team"**
2. Fill in:
   - **Team Name**: Required
   - **Max Members**: 1-100 (default: 10)
   - **Description**: Optional
3. Click **"Create Team"**

```
┌─────────────────────────────────────┐
│ Team Name: [Marketing Team____]    │
│ Max Members: [10]  ← Set limit here│
│ Description: [___________________] │
│ [Create Team]                       │
└─────────────────────────────────────┘
```

---

## 📧 Email Format

**Valid emails:**
- ✅ user@example.com
- ✅ john.doe@company.org
- ✅ sarah+work@gmail.com

**Invalid emails:**
- ❌ notanemail
- ❌ missing@domain
- ❌ @nodomain.com

---

## 🎬 Complete Example

### **Scenario:** Add Sarah to Marketing Team

**Step 1:** Switch to TeamDO mode
- Click mode toggle: TODO. → **TeamDO.**

**Step 2:** Open Teams
- Click **[Teams]** button (next to List and Calendar)

**Step 3:** Find Marketing Team card
- Scroll to "Marketing Team"
- See current members: [2 / 10]

**Step 4:** Invite Sarah
- Click **"+ Invite Member (8 slots left)"**
- Type: `sarah@company.com`
- Click **"Send"**

**Step 5:** Verify
- Sarah appears in "Pending Invitations" section
- Member count stays [2 / 10] until she accepts
- Available slots now: 7 slots left

**Step 6:** Sarah accepts (when backend is ready)
- She receives invitation
- She accepts
- She becomes a member
- Count updates to [3 / 10]

---

## 🚫 Common Issues

### **"Invite Member" Button Not Showing**

**Possible reasons:**
1. Team is full (reached max_members)
2. Not in TeamDO mode
3. Not the team owner

**Solution:**
- Check member count vs. max
- Switch to TeamDO mode
- Ensure you're the owner

### **"Teams" Button Not Visible**

**Reason:** You're in Personal mode (TODO.)

**Solution:** Click mode toggle to switch to **TeamDO.**

### **Email Invalid Error**

**Reason:** Email format is wrong

**Solution:** 
- Check email has @ symbol
- Check domain is included (.com, .org, etc.)
- No spaces in email

### **Already Invited Error**

**Reason:** Person already has pending invitation or is a member

**Solution:**
- Check "Pending Invitations" section
- Check "Members" section
- Cancel old invitation if needed

---

## 🎯 Tips

### **Best Practices:**

1. **Set Appropriate Team Size**
   - Small teams: 5-10 members
   - Medium teams: 10-25 members
   - Large teams: 25-50 members

2. **Use Clear Team Names**
   - ✅ "Sales Team Q1"
   - ✅ "Frontend Development"
   - ❌ "Team 1"

3. **Add Descriptions**
   - Helps members understand team purpose
   - Include team goals or focus areas

4. **Track Invitations**
   - Cancel expired invitations
   - Re-invite if needed
   - Follow up with invited members

5. **Manage Team Size**
   - Leave buffer for growth
   - Don't set max too low
   - Can't increase after creation (yet)

---

## 🔮 Coming Soon

### **Future Features:**

- 📧 **Email Notifications** - Actual invitation emails sent
- 🔗 **Invitation Links** - One-click join via URL
- 👥 **Bulk Invitations** - Invite multiple at once
- 🔄 **Accept/Reject UI** - Interface for recipients
- 📊 **Member Management** - Remove/transfer members
- ⚙️ **Adjust Team Size** - Increase max_members later

---

## 📱 Mobile View

Works the same on mobile:
1. Tap mode toggle → TeamDO
2. Tap **Teams** button
3. Tap **+ Invite Member**
4. Enter email
5. Tap **Send**

---

## ⚠️ Important Notes

### **Current Limitations:**

1. **Backend Not Implemented Yet**
   - Invitations are created in UI
   - Need backend API to actually send
   - Member addition happens when backend ready

2. **No Actual Emails**
   - Currently just creates invitation record
   - Future: will send actual emails

3. **Manual Acceptance**
   - Need to implement accept/reject flow
   - Coming in next update

### **What Works Now:**

✅ Create teams with max members  
✅ UI for inviting members  
✅ Track pending invitations  
✅ Cancel invitations  
✅ View member lists  
✅ Member count tracking  

### **What Needs Backend:**

⏳ Send invitation emails  
⏳ Accept/reject invitations  
⏳ Add members to team  
⏳ Remove members  
⏳ Check team owner permissions  

---

## 🆘 Need Help?

**Quick Reference:**
- Where: TeamDO mode → Teams button → Team card
- Who: Must be team owner
- Limit: Based on team's max_members setting
- Format: Valid email address required

**Documentation:**
- See `docs/Teams Management.md` for overview
- See `docs/Team Invitations System.md` for technical details
- See `database/migrations/001_add_team_invitations.sql` for database schema

---

## 🎓 Summary

**To add people to your team:**

```
1. Switch to TeamDO mode
2. Click Teams button
3. Find your team
4. Click "+ Invite Member"
5. Enter email
6. Click Send
```

**That's it!** Simple, clean, and professional. 🎯

