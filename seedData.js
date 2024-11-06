async function seedData() {
    const supabaseUrl = 'https://btlchecofryrdsvdopfj.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0bGNoZWNvZnJ5cmRzdmRvcGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk0NDk0NTUsImV4cCI6MjA0NTAyNTQ1NX0.En0N951sxb7OWQ7M-dFdjqAZBHBsydekPVCJQzMlDTo';
  
    const todos = [
      { todo: 'Buy groceries', status: 'todo', category: 'shopping', important: true },
      { todo: 'Complete homework', status: 'doing', category: 'school', important: false },
      { todo: 'Attend meeting', status: 'todo', category: 'work', important: true },
      { todo: 'Clean the house', status: 'stuck', category: 'home', important: false }
    ];
  
    // Function to add todos
    const addTodos = async () => {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/todos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify(todos)
        });
  
        const data = await response.json();
        console.log('Added todos:', data);
        return data; // Return added todos so we can use the IDs for updates
      } catch (error) {
        console.error('Error adding todos:', error);
      }
    };
  
    // Function to update a todo
    const updateTodo = async (todoId, newStatus) => {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/todos?id=eq.${todoId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ status: newStatus })
        });
  
        const data = await response.json();
        console.log(`Updated todo with ID ${todoId}:`, data);
      } catch (error) {
        console.error(`Error updating todo with ID ${todoId}:`, error);
      }
    };
  
    // Seed the data by adding todos and then updating one of them
    const addedTodos = await addTodos();
    if (addedTodos && addedTodos.length > 0) {
      // Update the status of the first todo added as an example
      await updateTodo(addedTodos[0].id, 'done');
    }
  }
  
  // Run this function in the console
  seedData();
  