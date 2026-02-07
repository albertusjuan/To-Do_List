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

    res.json({
      success: true,
      data: members || []
    });
  } catch (error: any) {
    console.error('Error fetching team members:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get team invitations (empty for now since no table)
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

    // Return empty array since we don't have team_invitations table
    res.json({
      success: true,
      data: []
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

    // Note: invite_emails are ignored for now since we don't have team_invitations table
    // You can implement email invitations later

    res.status(201).json({
      success: true,
      data: team
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

