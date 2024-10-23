import express from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();

// Supabase credentials
const supabaseUrl = 'https://btlchecofryrdsvdopfj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0bGNoZWNvZnJ5cmRzdmRvcGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk0NDk0NTUsImV4cCI6MjA0NTAyNTQ1NX0.En0N951sxb7OWQ7M-dFdjqAZBHBsydekPVCJQzMlDTo';  // Replace with your API key
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware for JSON handling
app.use(express.json());

// Example: Get all items from a Supabase table
app.get('/todos', async (req, res) => {
    const { data, error } = await supabase
        .from('todos')  // Replace 'items' with your table name
        .select('*');
    
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.json(data);
});

app.post('/todos', async (req, res) => {
  const { todo } = req.body; // This expects 'todo' in the request body

  const { data, error }  = await supabase
    .from('todos')
    .insert([{ todo }]); // The id and created_at fields are automatically added by Supabase

  if ( error ) {
  return res.status(500).json({ error: error.message });
  }
  res.status(201).json(data); //returns the inserted data
});

app.get('/todos/:id', async ( req, res ) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('todos')
    .select('id, created_at, todo')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
})

app.put('/todos/:id', async ( req, res ) => {
  const {id} = req.params;
  const {todo} = req.body; // This will only update the todo

  const { data, error } = await supabase
    .from('todos')
    .update({ todo })
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(`udpated todo number ${id}: ${data}`);
})

app.delete ('/todos/:id', async ( req, res ) => {
  const {id} = req.params;

  const { data, error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(`Deleted ${id}: ${data}`);
})

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});