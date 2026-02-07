import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get all pending invitations for the authenticated user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId || !userEmail) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Fetch pending invitations for the user
    const { data: invitations, error } = await supabase
      .from('team_invitations')
      .select(`
        *,
        teams:team_id (
          name,
          description
        )
      `)
      .eq('invited_user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Get inviter names
    const invitationsWithNames = await Promise.all(
      (invitations || []).map(async (inv) => {
        try {
          const { data: inviterEmail } = await supabase
            .rpc('get_user_email_by_id', { p_user_id: inv.invited_by });
          
          return {
            id: inv.id,
            team_id: inv.team_id,
            team_name: inv.teams?.name || 'Unknown Team',
            team_description: inv.teams?.description || '',
            invited_by: inv.invited_by,
            invited_by_email: inviterEmail || 'Unknown',
            created_at: inv.created_at
          };
        } catch (err) {
          return {
            id: inv.id,
            team_id: inv.team_id,
            team_name: inv.teams?.name || 'Unknown Team',
            team_description: inv.teams?.description || '',
            invited_by: inv.invited_by,
            invited_by_email: 'Unknown',
            created_at: inv.created_at
          };
        }
      })
    );

    res.json({
      success: true,
      data: invitationsWithNames
    });
  } catch (error: any) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Accept invitation
router.post('/:invitationId/accept', async (req: Request, res: Response) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get invitation details
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select('*, teams:team_id(max_members)')
      .eq('id', invitationId)
      .eq('invited_user_id', userId)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found or already processed'
      });
    }

    // Check team capacity
    const { data: members, error: countError } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', invitation.team_id);

    if (countError) throw countError;

    const maxMembers = invitation.teams?.max_members || 10;
    if (members && members.length >= maxMembers) {
      return res.status(400).json({
        success: false,
        error: `Team is full. Maximum ${maxMembers} members allowed.`
      });
    }

    // Add user to team
    const { error: memberError } = await supabase
      .from('team_members')
      .insert([{
        team_id: invitation.team_id,
        user_id: userId,
        role: 'member',
        joined_at: new Date().toISOString()
      }]);

    if (memberError) throw memberError;

    // Update invitation status
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString()
      })
      .eq('id', invitationId);

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: 'Invitation accepted successfully! Welcome to the team.'
    });
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Decline invitation
router.post('/:invitationId/decline', async (req: Request, res: Response) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get invitation and verify ownership
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('invited_user_id', userId)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found or already processed'
      });
    }

    // Update invitation status to declined
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({
        status: 'declined',
        responded_at: new Date().toISOString()
      })
      .eq('id', invitationId);

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: 'Invitation declined'
    });
  } catch (error: any) {
    console.error('Error declining invitation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

