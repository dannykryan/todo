import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://btlchecofryrdsvdopfj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0bGNoZWNvZnJ5cmRzdmRvcGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk0NDk0NTUsImV4cCI6MjA0NTAyNTQ1NX0.En0N951sxb7OWQ7M-dFdjqAZBHBsydekPVCJQzMlDTo';
const supabase = createClient(supabaseUrl, supabaseKey);

const inputBox = document.getElementById('input-box');
const addButton = document.getElementById('add-button');
const submitButton = document.getElementById('submit-button');
const deleteButton = document.getElementById('delete-button');
const modal = document.getElementById('modal');
const closeButton = document.querySelector('.close');
const statusSelector = document.getElementById('status-selector');
const categorySelector = document.getElementById('category-selector');
const importantCheckbox = document.getElementById('important');
const kanbanContainer = document.getElementById('kanban-container');
const sortSelector = document.getElementById('sort-selector');

const searchButton = document.getElementById('search-button');
const searchModal = document.getElementById('search-modal');
const closeSearchModal = document.getElementById('close-search-modal');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

let currentTodoId = null; // Variable to store the current todo's ID

// Fetch and display todos on page load
async function fetchTodos() {
  const { data: todos, error } = await supabase
    .from('todos')
    .select('*')
    .order('created_at', { ascending: false })  // Sort by created_at, descending order
    .order('uuid', { ascending: true }); // Sort by uuid as a tiebreaker

  if (error) {
    console.error('Error fetching todos:', error.message);
    return;
  }

  // Clear the kanban container before adding new items
  kanbanContainer.innerHTML = '';

  const sortBy = sortSelector.value; // Get the selected sort option

  // Group todos by either 'status' or 'category' based on the selected sort
  const groups = groupTodos(todos, sortBy);

  // Dynamically create kanban-status containers
  Object.keys(groups).forEach(groupKey => {
    const groupContainer = createKanbanStatusContainer(groupKey, groups[groupKey]);
    kanbanContainer.appendChild(groupContainer);
  });
}

// Group todos by 'status' or 'category'
function groupTodos(todos, sortBy) {
  const grouped = {};

  // Define the specific order for categories and statuses
  const categoryOrder = ['shopping', 'home', 'work', 'school']; // Order for categories
  const statusOrder = ['todo', 'doing', 'done', 'stuck']; // Order for statuses

  // Group todos by 'status' or 'category'
  todos.forEach(todo => {
    const groupKey = todo[sortBy]; // 'status' or 'category'
    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }
    grouped[groupKey].push(todo);
  });

  // Sort the grouped todos according to the fixed order
  const sortedGroups = {};
  if (sortBy === 'category') {
    categoryOrder.forEach(category => {
      if (grouped[category]) {
        sortedGroups[category] = grouped[category];
      }
    });
  } else if (sortBy === 'status') {
    statusOrder.forEach(status => {
      if (grouped[status]) {
        sortedGroups[status] = grouped[status];
      }
    });
  }

  return sortedGroups;
}

// Create a new kanban-status div
function createKanbanStatusContainer(groupKey, todos, isCategory = false) {
  const kanbanStatusDiv = document.createElement('div');
  
  // Add the correct class based on whether this is a category or status
  if (sortSelector.value === 'category') {
    kanbanStatusDiv.classList.add('kanban-category');
  } else {
    kanbanStatusDiv.classList.add('kanban-status');
  }

  const heading = document.createElement('h2');
  heading.textContent = groupKey.charAt(0).toUpperCase() + groupKey.slice(1); // Capitalize the first letter
  kanbanStatusDiv.appendChild(heading);

  const ul = document.createElement('ul');
  ul.id = groupKey + '-list'; // Set the id to the group name (status or category)
  ul.classList.add('list');

  // Icon mapping for each category
  const iconMapping = {
    shopping: '/images/shop-icon.svg',
    home: '/images/home-icon.svg',
    work: '/images/work-icon.svg',
    school: '/images/school-icon.svg'
  };

  todos.forEach(todo => {
    const li = document.createElement('li');
    li.textContent = todo.todo;
    li.dataset.uuid = todo.uuid;

    // Create the category icon and set it based on the todo's category
    const categoryIcon = document.createElement('img');
    // Set the icon dynamically based on the todo's category
    categoryIcon.src = iconMapping[todo.category] || '/images/edit-icon.svg'; // Default icon if category is unknown
    categoryIcon.alt = 'category-icon';
    categoryIcon.classList.add('category-icon');

    // Add event listener to open the modal with the current todo's details
    li.addEventListener('click', () => {
      openEditModal(todo);
    });

    // Delete todo when the category icon is clicked
    categoryIcon.addEventListener('click', (event) => {
      event.stopPropagation();
      deleteTodo(todo.uuid);
    });

    // Append category icon to the list item
    li.appendChild(categoryIcon);

    ul.appendChild(li);
  });

  kanbanStatusDiv.appendChild(ul);
  return kanbanStatusDiv;
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
  return importantCheckbox.checked;  // returns true if checked, false if not
}

// Show the modal when the add button is clicked
addButton.addEventListener('click', () => {
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

// Open the modal when clicking a todo item
function openEditModal(todo) {
  inputBox.value = todo.todo; // Set the input box value to the current todo text
  document.getElementById('status-selector').value = todo.status; // Set the status selector to the current status
  modal.style.display = 'block'; // Show the modal
  currentTodoId = todo.uuid;
  deleteButton.style.display = 'block';
  importantCheckbox.checked = todo.important;
}

// Set up event listeners
submitButton.addEventListener('click', addTodo);

// Handle sort selection change
sortSelector.addEventListener('change', fetchTodos);

// Search functionality
searchInput.addEventListener('input', async function() {
  const searchTerm = searchInput.value.trim().toLowerCase();  // Get the search input and make it lowercase for case-insensitive search
  
  if (searchTerm === '') {
    // If no search term, clear results
    searchResults.innerHTML = '';
    return;
  }

  // Query Supabase to search for todos that match the search term
  const { data: todos, error } = await supabase
    .from('todos')
    .select('*')
    .ilike('todo', `%${searchTerm}%`); // Search for todos where the 'todo' field contains the search term (case-insensitive)

  if (error) {
    console.error('Error searching todos:', error.message);
    return;
  }

  // Clear previous search results
  searchResults.innerHTML = '';

  // Display the search results in the modal
  if (todos.length === 0) {
    searchResults.innerHTML = '<li>No results found.</li>';
  } else {
    todos.forEach(todo => {
      const resultItem = document.createElement('li');
      resultItem.textContent = todo.todo;
      resultItem.dataset.uuid = todo.uuid; // Store the UUID for each result
      
      // Add click event to open the todo in the edit modal
      resultItem.addEventListener('click', () => {
        openEditModal(todo);  // Opens the edit modal with the selected todo
        searchModal.style.display = 'none'; // Close the search modal after selecting a todo
      });
      
      searchResults.appendChild(resultItem);
    });
  }
});

// Listen for the click event on the search button
searchButton.addEventListener('click', function() {
  searchModal.style.display = 'block';
});

// Listen for the click event on the search button
closeSearchModal.addEventListener('click', function() {
  // Show the search modal when the button is clicked
  searchModal.style.display = 'none';
});

// Close the modal if clicked outside
window.addEventListener('click', function(event) {
  if (event.target === searchModal) {
    searchModal.style.display = 'none';
  }
});

// Fetch todos on page load
fetchTodos();