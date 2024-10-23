import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://btlchecofryrdsvdopfj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0bGNoZWNvZnJ5cmRzdmRvcGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk0NDk0NTUsImV4cCI6MjA0NTAyNTQ1NX0.En0N951sxb7OWQ7M-dFdjqAZBHBsydekPVCJQzMlDTo';
const supabase = createClient(supabaseUrl, supabaseKey);

const inputBox = document.getElementById('input-box');
const listContainer = document.getElementById('list-container');
const addButton = document.getElementById('add-button');
const checkbox = document.getElementsByClassName('checkbox');

// Fetch and display todos on page load
async function fetchTodos() {
  const { data: todos, error } = await supabase .from('todos') .select('*');
  if (error) {
    console.error('Error fetching todos:', error.message);
    return;
  }
  // clear the list before appending new items
  listContainer.innerHTML = '';

  // append each todo item in the list
  todos.forEach(todo => {
    const li = document.createElement('li');
    li.textContent = todo.todo;
    listContainer.appendChild(li);
  })
}

// Add new todo
async function addTask() {
  const todoText = inputBox.value;

  if (!todoText.trim()) return; // Prevent adding empty task

  const { data, error } = await supabase
    .from('todos')
    .insert([{ todo: todoText }]);

  if (error) {
    console.error('Error adding todo:', error);
    return;
  }

  fetchTodos(); // Refresh list after adding
  inputBox.value = ''; // Clear input
}

// Toggle the completed status of a todo
async function toggleComplete(id, isCompleted) {
  const { data, error } = await supabase
    .from('todos')
    .update({ completed: isCompleted }) // Update the completed status
    .eq('id', id);

  if (error) {
    console.error('Error updating todo:', error);
    return;
  }

  fetchTodos(); // Refresh the list to reflect the changes
}

// Set up event listeners
addButton.addEventListener('click', addTask);

fetchTodos();