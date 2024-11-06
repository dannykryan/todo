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
const deleteButton = document.getElementById('delete-button');
const modal = document.getElementById('modal');
const closeButton = document.querySelector('.close');
const statusSelector = document.getElementById('status-selector');
const categorySelector = document.getElementById('category-selector');
const importantCheckbox = document.getElementById('important');

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
  todos.forEach(todo => {
    const li = document.createElement('li');
    li.textContent = todo.todo;

    // Set the id as a data attribute
    li.dataset.uuid = todo.uuid; // Store the uuid in a data attribute

    // Create the edit icon
    const editIcon = document.createElement('img');
    editIcon.src = '/images/edit-icon.svg';
    editIcon.alt = 'Delete';
    editIcon.classList.add('edit-icon');

    // Add event listener to open the modal with the current todo's details
    li.addEventListener('click', () => {
      openEditModal(todo);
    });

    // Delete todo when the edit icon is clicked
    editIcon.addEventListener('click', (event) => {
      event.stopPropagation();
      deleteTodo(todo.uuid);
    });

    // Append edit icon to the list item
    li.appendChild(editIcon);

    // Append to the appropriate container based on status
    switch (todo.status) {
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
        console.warn(`Unrecognized status: ${todo.status}`);
    }
  });
}

// Delete button will delete the current todo
deleteButton.addEventListener('click', () => {
  deleteTodo(currentTodoId);
  resetAndCloseModal();
});

// Function to delete a todo
async function deleteTodo(uuid) {
  const { data, error } = await supabase
    .from('todos')
    .delete()
    .eq('uuid', uuid); // Match the todo uuid to delete

  if (error) {
    console.error('Error deleting todo:', error);
    return;
  }

  fetchTodos(); // Refresh the list to reflect the changes
}

// Add new todo
async function addTodo() {
  const todoText = inputBox.value;
  const selectedStatus = statusSelector.value;
  const selectedCategory = categorySelector.value;

  if (!todoText.trim()) return; // Prevent adding empty task

  if (currentTodoId) {
    // Update the existing todo
    const { data, error } = await supabase
      .from('todos')
      .update({ todo: todoText, status: selectedStatus, category: selectedCategory, important: getCheckboxValue() }) // Update the text and status
      .eq('uuid', currentTodoId); // Match the current todo ID

    if (error) {
      console.error('Error updating todo:', error);
      return;
    }
  } else {
    // Add new todo
    const { data, error } = await supabase
      .from('todos')
      .insert([{ todo: todoText, completed: false, status: selectedStatus, category: selectedCategory, important: getCheckboxValue() }]);

    if (error) {
      console.error('Error adding todo:', error);
      return;
    }
  }

  resetAndCloseModal();
  fetchTodos(); // Refresh list after adding/updating
}

let resetAndCloseModal = () => {
  // Reset all the modal values, current id and close the modal
  inputBox.value = '';
  document.getElementById('status-selector').value = 'todo';
  document.getElementById('category-selector').value = 'shopping';
  modal.style.display = 'none';
  currentTodoId = null;
  deleteButton.style.display = 'none';
  importantCheckbox.checked = false;
}

// Get the checkbox value
function getCheckboxValue() {
  return importantCheckbox.checked ? importantCheckbox.value : "false";
}

// Show the modal when the add button is clicked
document.getElementById('add-button').addEventListener('click', () => {
  modal.style.display = 'block';
  currentTodoId = null; // Clear the current todo ID for adding a new todo
  deleteButton.style.display = 'none'; // Hide delete button in add mode
});

// Close the modal when the close button is clicked
closeButton.addEventListener('click', () => {
  resetAndCloseModal();
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
  document.getElementById('status-selector').value = todo.status; // Set the status selector to the current status
  modal.style.display = 'block'; // Show the modal
  currentTodoId = todo.uuid;
  deleteButton.style.display = 'block';
}

// Set up event listeners
submitButton.addEventListener('click', addTodo);

// Fetch todos on page load
fetchTodos();