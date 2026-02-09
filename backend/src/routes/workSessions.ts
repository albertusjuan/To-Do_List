import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get work sessions for a todo
router.get('/todo/:todoId', async (req: Request, res: Response) => {
  try {
    const { todoId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get work sessions
    const { data: sessions, error } = await supabase
      .from('work_sessions')
      .select('*')
      .eq('todo_id', todoId)
      .order('started_at', { ascending: false });

    if (error) throw error;

    // Fetch user emails for each session
    const sessionsWithEmails = await Promise.all(
      (sessions || []).map(async (session) => {
        try {
          const { data: email } = await supabase
            .rpc('get_user_email_by_id', { p_user_id: session.user_id });
          return { ...session, user_email: email || 'Unknown' };
        } catch {
          return { ...session, user_email: 'Unknown' };
        }
      })
    );

    res.json({
      success: true,
      data: sessionsWithEmails
    });
  } catch (error: any) {
    console.error('Error fetching work sessions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start a work session
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { todo_id } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!todo_id) {
      return res.status(400).json({
        success: false,
        error: 'todo_id is required'
      });
    }

    // Check if user has access to this todo (via team or ownership)
    const { data: todo, error: todoError } = await supabase
      .from('todos')
      .select('id, team_id, user_id')
      .eq('id', todo_id)
      .single();

    if (todoError || !todo) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
    }

    // Check access
    if (todo.team_id) {
      const { data: membership } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', todo.team_id)
        .eq('user_id::uuid', userId)
        .single();

      if (!membership) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    } else if (todo.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Check if user already has an active session for this todo
    const { data: activeSessions } = await supabase
      .from('work_sessions')
      .select('id')
      .eq('todo_id', todo_id)
      .eq('user_id', userId)
      .is('ended_at', null);

    if (activeSessions && activeSessions.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active work session for this todo'
      });
    }

    // Create new work session
    const { data: session, error: sessionError } = await supabase
      .from('work_sessions')
      .insert([{
        todo_id,
        user_id: userId,
        started_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (sessionError) throw sessionError;

    res.json({
      success: true,
      data: session
    });
  } catch (error: any) {
    console.error('Error starting work session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Stop a work session
router.post('/stop/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get the session
    const { data: session, error: sessionError } = await supabase
      .from('work_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        error: 'Work session not found or access denied'
      });
    }

    if (session.ended_at) {
      return res.status(400).json({
        success: false,
        error: 'Work session already ended'
      });
    }

    // Calculate duration in minutes
    const startedAt = new Date(session.started_at);
    const endedAt = new Date();
    const durationMinutes = Math.floor((endedAt.getTime() - startedAt.getTime()) / 60000);

    // Update session
    const { data: updatedSession, error: updateError } = await supabase
      .from('work_sessions')
      .update({
        ended_at: endedAt.toISOString(),
        duration_minutes: durationMinutes
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      data: updatedSession
    });
  } catch (error: any) {
    console.error('Error stopping work session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user's active work session
router.get('/active', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { data: sessions, error } = await supabase
      .from('work_sessions')
      .select('*, todos(*)')
      .eq('user_id', userId)
      .is('ended_at', null);

    if (error) throw error;

    res.json({
      success: true,
      data: sessions || []
    });
  } catch (error: any) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
