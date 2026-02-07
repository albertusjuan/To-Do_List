import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get all TODOs with optional filtering and sorting
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, due_date_from, due_date_to, sort_by = 'created_at', sort_order = 'desc' } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // IMPORTANT: Filter by user_id to ensure data isolation
    // Even with RLS, we explicitly filter for security
    let query = supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId); // CRITICAL: Only fetch user's own todos

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    // Filter by due date range
    if (due_date_from) {
      query = query.gte('due_date', due_date_from);
    }
    if (due_date_to) {
      query = query.lte('due_date', due_date_to);
    }

    // Sorting
    const orderColumn = sort_by as string;
    const orderDirection = sort_order === 'asc';
    query = query.order(orderColumn, { ascending: orderDirection });

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data,
      count: data?.length || 0
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get single TODO by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // CRITICAL: Filter by user_id to prevent accessing other users' todos
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId) // Only allow access to own todos
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'TODO not found or access denied'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new TODO
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, due_date, status = 'NOT_STARTED', team_id } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Validation
    if (!name || !description || !due_date) {
      return res.status(400).json({
        success: false,
        error: 'Name, description, and due_date are required'
      });
    }

    // CRITICAL: Always set user_id to prevent creating todos for other users
    const { data, error } = await supabase
      .from('todos')
      .insert([{
        user_id: userId, // CRITICAL: Set the authenticated user as owner
        name,
        description,
        due_date,
        status,
        team_id: team_id || null
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update TODO
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, due_date, status, team_id } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (due_date !== undefined) updateData.due_date = due_date;
    if (status !== undefined) updateData.status = status;
    if (team_id !== undefined) updateData.team_id = team_id;

    // CRITICAL: Filter by user_id to prevent updating other users' todos
    const { data, error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId) // Only allow updating own todos
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'TODO not found or access denied'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete TODO
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // CRITICAL: Filter by user_id to prevent deleting other users' todos
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Only allow deleting own todos

    if (error) throw error;

    res.json({
      success: true,
      message: 'TODO deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;


