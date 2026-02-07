import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get all teams for the authenticated user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get teams where user is a member
    const { data: memberData, error: memberError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId);

    if (memberError) throw memberError;

    const teamIds = memberData?.map(m => m.team_id) || [];

    if (teamIds.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get team details
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .in('id', teamIds)
      .order('created_at', { ascending: false });

    if (teamsError) throw teamsError;

    res.json({
      success: true,
      data: teams || []
    });
  } catch (error: any) {
    console.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get team members
router.get('/:teamId/members', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Check if user is a member of this team
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();

    if (memberError || !membership) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Get all members
    const { data: members, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .order('joined_at', { ascending: true });

    if (error) throw error;

    // Fetch emails for each member using the database function
    const membersWithEmails = await Promise.all(
      (members || []).map(async (member) => {
        try {
          const { data: email, error: emailError } = await supabase
            .rpc('get_user_email_by_id', { p_user_id: member.user_id });
          
          return {
            ...member,
            email: !emailError && email ? email : 'Unknown'
          };
        } catch (err) {
          // If function doesn't exist yet, return without email
          return {
            ...member,
            email: 'Run migration 005 to see emails'
          };
        }
      })
    );

    res.json({
      success: true,
      data: membersWithEmails
    });
  } catch (error: any) {
    console.error('Error fetching team members:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get team invitations
router.get('/:teamId/invitations', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Check if user is a member of this team
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();

    if (memberError || !membership) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Get pending invitations for this team
    const { data: invitations, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', teamId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: invitations || []
    });
  } catch (error: any) {
    console.error('Error fetching team invitations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new team
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, max_members = 10, invite_emails = [] } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Team name is required'
      });
    }

    const maxMembersNum = parseInt(max_members, 10);
    if (maxMembersNum < 1 || maxMembersNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'max_members must be between 1 and 100'
      });
    }

    // Create team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert([{
        name,
        description: description || null,
        max_members: maxMembersNum
      }])
      .select()
      .single();

    if (teamError) throw teamError;

    // Add creator as owner
    const { error: memberError } = await supabase
      .from('team_members')
      .insert([{
        team_id: team.id,
        user_id: userId,
        role: 'owner',
        joined_at: new Date().toISOString()
      }]);

    if (memberError) throw memberError;

    // Process invite_emails if provided
    const invitationResults = [];
    if (invite_emails && invite_emails.length > 0) {
      for (const email of invite_emails) {
        try {
          // Find user by email
          const { data: userResult, error: userError } = await supabase
            .rpc('get_user_by_email', { user_email: email });

          if (!userError && userResult && userResult.length > 0) {
            const invitedUserId = userResult[0]?.id;

            // Check if already a member
            const { data: existingMember } = await supabase
              .from('team_members')
              .select('id')
              .eq('team_id', team.id)
              .eq('user_id', invitedUserId)
              .single();

            if (!existingMember) {
              // Create invitation
              await supabase
                .from('team_invitations')
                .insert([{
                  team_id: team.id,
                  invited_by: userId,
                  invited_email: email,
                  invited_user_id: invitedUserId,
                  status: 'pending',
                  created_at: new Date().toISOString()
                }]);
              invitationResults.push({ email, status: 'invited' });
            } else {
              invitationResults.push({ email, status: 'already_member' });
            }
          } else {
            invitationResults.push({ email, status: 'user_not_found' });
          }
        } catch (err) {
          console.error(`Error inviting ${email}:`, err);
          invitationResults.push({ email, status: 'error' });
        }
      }
    }

    res.status(201).json({
      success: true,
      data: team,
      invitations: invitationResults
    });
  } catch (error: any) {
    console.error('Error creating team:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update team
router.put('/:teamId', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const { name, description, max_members } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Check if user is owner
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();

    if (memberError || !membership || membership.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Only team owners can update team settings'
      });
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (max_members !== undefined) {
      const maxMembersNum = parseInt(max_members, 10);
      if (maxMembersNum < 1 || maxMembersNum > 100) {
        return res.status(400).json({
          success: false,
          error: 'max_members must be between 1 and 100'
        });
      }
      updateData.max_members = maxMembersNum;
    }

    const { data: team, error } = await supabase
      .from('teams')
      .update(updateData)
      .eq('id', teamId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: team
    });
  } catch (error: any) {
    console.error('Error updating team:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Invite member to team
router.post('/:teamId/invite', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const { email } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Check if user is a member (and can invite)
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();

    if (memberError || !membership) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You must be a team member to invite others.'
      });
    }

    // Get team details to check capacity
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*, max_members')
      .eq('id', teamId)
      .single();

    if (teamError) throw teamError;

    // Count current members
    const { data: members, error: countError } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId);

    if (countError) throw countError;

    if (members && members.length >= (team.max_members || 10)) {
      return res.status(400).json({
        success: false,
        error: `Team is full. Maximum ${team.max_members} members allowed.`
      });
    }

    // First, try to find user by email using the database function
    const { data: userResult, error: userError } = await supabase
      .rpc('get_user_by_email', { user_email: email });

    if (userError) {
      console.error('Error finding user by email:', userError);
      return res.status(500).json({
        success: false,
        error: `Failed to find user. Make sure you've run migrations 004 and 005 in Supabase SQL Editor. Error: ${userError.message}`
      });
    }

    if (!userResult || (Array.isArray(userResult) && userResult.length === 0)) {
      return res.status(404).json({
        success: false,
        error: `No user found with email: ${email}. They must sign up first.`
      });
    }

    const userArray = Array.isArray(userResult) ? userResult : [userResult];
    const invitedUserId = userArray[0]?.id;

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', invitedUserId)
      .single();

    if (existingMember) {
      return res.status(400).json({
        success: false,
        error: 'User is already a member of this team'
      });
    }

    // Check if invitation already exists
    const { data: existingInvite } = await supabase
      .from('team_invitations')
      .select('id, status')
      .eq('team_id', teamId)
      .eq('invited_email', email)
      .single();

    if (existingInvite) {
      if (existingInvite.status === 'pending') {
        return res.status(400).json({
          success: false,
          error: 'An invitation has already been sent to this user'
        });
      }
    }

    // Create invitation record
    const { error: inviteError } = await supabase
      .from('team_invitations')
      .insert([{
        team_id: teamId,
        invited_by: userId,
        invited_email: email,
        invited_user_id: invitedUserId,
        status: 'pending',
        created_at: new Date().toISOString()
      }]);

    if (inviteError) throw inviteError;

    res.json({
      success: true,
      message: `Invitation sent to ${email}! They will see it in their notifications.`
    });
  } catch (error: any) {
    console.error('Error inviting member:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete team
router.delete('/:teamId', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Check if user is owner
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();

    if (memberError || !membership || membership.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Only team owners can delete teams'
      });
    }

    // Delete team members first
    const { error: deleteMembersError } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId);

    if (deleteMembersError) throw deleteMembersError;

    // Delete team
    const { error: deleteTeamError } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (deleteTeamError) throw deleteTeamError;

    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting team:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

