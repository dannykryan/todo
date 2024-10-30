import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://btlchecofryrdsvdopfj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0bGNoZWNvZnJ5cmRzdmRvcGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk0NDk0NTUsImV4cCI6MjA0NTAyNTQ1NX0.En0N951sxb7OWQ7M-dFdjqAZBHBsydekPVCJQzMlDTo';
const supabase = createClient(supabaseUrl, supabaseKey);

const inputBox = document.getElementById('input-box');
const todoListContainer = document.getElementById('todo-list');
const doingListContainer = document.getElementById('doing-list');
const doneListContainer = document.getElementById('done-list');
const stuckListContainer = document.getElementById('stuck-list');
const addButton = document.getElementById('add-button');
const submitButton = document.getElementById('submit-button');
const modal = document.getElementById('modal');
const closeButton = document.querySelector('.close');

let currentTodoId = null; // Variable to store the current todo's ID

// Fetch and display todos on page load
async function fetchTodos() {
  const { data: todos, error } = await supabase
    .from('todos')
    .select('*');
  
  if (error) {
    console.error('Error fetching todos:', error.message);
    return;
  }

  // Clear the list before appending new items
  todoListContainer.innerHTML = '';
  doingListContainer.innerHTML = '';
  doneListContainer.innerHTML = '';
  stuckListContainer.innerHTML = '';

  // Append each todo item to the list
  // Append each todo item to the list
  todos.forEach(todo => {
    const li = document.createElement('li');
    li.textContent = todo.todo;

    // Set the id as a data attribute
    li.dataset.id = todo.id; // Store the id in a data attribute

    // Add event listener to open the modal with the current todo's details
    li.addEventListener('click', () => {
      openEditModal(todo);
    });

    // Append to the appropriate container based on category
    switch (todo.category) {
      case 'todo':
        todoListContainer.appendChild(li);
        break;
      case 'doing':
        doingListContainer.appendChild(li);
        break;
      case 'done':
        doneListContainer.appendChild(li);
        break;
      case 'stuck':
        stuckListContainer.appendChild(li);
        break;
      default:
        console.warn(`Unrecognized category: ${todo.category}`);
    }
  });
}

// Add new todo
async function addTask() {
  const todoText = inputBox.value;
  const categorySelector = document.getElementById('category-selector');
  const selectedCategory = categorySelector.value;

  if (!todoText.trim()) return; // Prevent adding empty task

  if (currentTodoId) {
    // Update the existing todo
    const { data, error } = await supabase
      .from('todos')
      .update({ todo: todoText, category: selectedCategory }) // Update the text and category
      .eq('id', currentTodoId); // Match the current todo ID

    if (error) {
      console.error('Error updating todo:', error);
      return;
    }
  } else {
    // Add new todo
    const { data, error } = await supabase
      .from('todos')
      .insert([{ todo: todoText, completed: false, category: selectedCategory }]);

    if (error) {
      console.error('Error adding todo:', error);
      return;
    }
  }

  inputBox.value = ''; // Clear input
  document.getElementById('category-selector').value = 'todo'; // Reset to default category
  modal.style.display = 'none'; // Close the modal after adding/updating
  currentTodoId = null; // Reset the currentTodoId for future additions
  fetchTodos(); // Refresh list after adding/updating
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

// Show the modal when the add button is clicked
document.getElementById('add-button').addEventListener('click', () => {
  modal.style.display = 'block';
});

// Close the modal when the close button is clicked
closeButton.addEventListener('click', () => {
  modal.style.display = 'none';
});

// Close the modal when clicking outside of the modal content
window.addEventListener('click', (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});

//Open the modal when clicking a todo item
function openEditModal(todo) {
  inputBox.value = todo.todo; // Set the input box value to the current todo text
  document.getElementById('category-selector').value = todo.category; // Set the category selector to the current category
  modal.style.display = 'block'; // Show the modal
  currentTodoId = todo.id; // Store the current todo's ID for updating
}

// Set up event listeners
submitButton.addEventListener('click', addTask);

// Fetch todos on page load
fetchTodos();
