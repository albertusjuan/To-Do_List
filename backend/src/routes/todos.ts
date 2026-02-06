import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// Get all TODOs with optional filtering and sorting
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, due_date_from, due_date_to, sort_by = 'created_at', sort_order = 'desc' } = req.query;

    let query = supabase
      .from('todos')
      .select('*');

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

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'TODO not found'
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

    // Validation
    if (!name || !description || !due_date) {
      return res.status(400).json({
        success: false,
        error: 'Name, description, and due_date are required'
      });
    }

    const { data, error } = await supabase
      .from('todos')
      .insert([{
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

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (due_date !== undefined) updateData.due_date = due_date;
    if (status !== undefined) updateData.status = status;
    if (team_id !== undefined) updateData.team_id = team_id;

    const { data, error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'TODO not found'
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

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

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


