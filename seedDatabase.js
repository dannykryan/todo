import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://btlchecofryrdsvdopfj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0bGNoZWNvZnJ5cmRzdmRvcGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk0NDk0NTUsImV4cCI6MjA0NTAyNTQ1NX0.En0N951sxb7OWQ7M-dFdjqAZBHBsydekPVCJQzMlDTo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
  try {
    // Clear the table by truncating it
    const { error: truncateError } = await supabase.rpc('truncate_table', { table_name: 'todos' });

    if (truncateError) {
      console.error('Error clearing table:', truncateError);
      return;
    }

    // Read and parse the JSON file
    const todos = JSON.parse(fs.readFileSync('seedData.json', 'utf-8'));

    // Insert seed data
    const { data, error } = await supabase
      .from('todos')
      .insert(todos);

    if (error) {
      console.error('Error inserting seed data:', error);
    } else {
      console.log('Seed data inserted successfully:', data);
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase();
