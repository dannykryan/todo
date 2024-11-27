import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

const inputBox = document.getElementById('input-box');
const descriptionBox = document.getElementById('description-box');
const addButton = document.getElementById('add-button');
const submitButton = document.getElementById('submit-button');
const deleteButton = document.getElementById('delete-button');
const modal = document.getElementById('modal');
const closeButton = document.querySelector('.close');
const statusSelector = document.getElementById('status-selector');
const categorySelector = document.getElementById('category-selector');
const importantCheckbox = document.getElementById('important');
const kanbanContainer = document.getElementById('kanban-container');
const viewSelector = document.getElementById('view-selector');
const sortSelector = document.getElementById('sort-selector');

const searchButton = document.getElementById('search-button');
const searchModal = document.getElementById('search-modal');
const closeSearchModal = document.getElementById('close-search-modal');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

let currentTodoId = null; // Variable to store the current todo's ID
let debounceTimer; // Timer for debouncing search input

// Fetch and display todos on page load
async function fetchTodos() {
  const { data: todos, error } = await supabase
    .from('todos')
    .select('*');

  if (error) {
    console.error('Error fetching todos:', error.message);
    return;
  }

  // Sort todos based on the selected option
  const sortBy = sortSelector.value;
  let sortedTodos;

  switch (sortBy) {
    case 'priority':
      sortedTodos = todos.sort((a, b) => {
        // Assuming "important" is a boolean, prioritize true over false
        return b.important - a.important;
      });
      break;
    case 'due date':
      sortedTodos = todos.sort((a, b) => {
        // Handle null/undefined due dates
        const dateA = a.due_date ? new Date(a.due_date) : new Date(0);
        const dateB = b.due_date ? new Date(b.due_date) : new Date(0);
        return dateA - dateB;
      });
      break;
    default: // 'most recent' or any other unrecognized value
      sortedTodos = todos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
  }

  // Clear the kanban container before adding new items
  kanbanContainer.innerHTML = '';

  const viewBy = viewSelector.value; // Get the selected view option (status/category)

  // Group todos by either 'status' or 'category'
  const groups = groupTodos(sortedTodos, viewBy);

  // Dynamically create kanban-status containers
  Object.keys(groups).forEach(groupKey => {
    const groupContainer = createKanbanStatusContainer(groupKey, groups[groupKey]);
    kanbanContainer.appendChild(groupContainer);
  });
}

// Group todos by 'status' or 'category'
function groupTodos(todos, viewBy) {
  const grouped = {};

  // Define the specific order for categories and statuses
  const categoryOrder = ['shopping', 'home', 'work', 'school'];
  const statusOrder = ['todo', 'doing', 'done', 'stuck'];

  // Group todos by 'status' or 'category'
  todos.forEach(todo => {
    const groupKey = todo[viewBy]; // 'status' or 'category'
    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }
    grouped[groupKey].push(todo);
  });

  // Sort the grouped todos according to the fixed order
  const sortedGroups = {};
  if (viewBy === 'category') {
    categoryOrder.forEach(category => {
      if (grouped[category]) {
        sortedGroups[category] = grouped[category];
      }
    });
  } else if (viewBy === 'status') {
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
  if (viewSelector.value === 'category') {
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
  const description = descriptionBox.value;
  const selectedStatus = statusSelector.value;
  const selectedCategory = categorySelector.value;

  if (!todoText.trim()) return; // Prevent adding empty task

  if (currentTodoId) {
    // Update the existing todo
    const { data, error } = await supabase
      .from('todos')
      .update({ todo: todoText, description: description, status: selectedStatus, category: selectedCategory, important: getCheckboxValue() }) // Update the text and status
      .eq('uuid', currentTodoId); // Match the current todo ID

    if (error) {
      console.error('Error updating todo:', error);
      return;
    }
  } else {
    // Add new todo
    const { data, error } = await supabase
      .from('todos')
      .insert([{ todo: todoText, description: description, completed: false, status: selectedStatus, category: selectedCategory, important: getCheckboxValue() }]);

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
  descriptionBox.value = '';
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
  descriptionBox.value = todo.description || '';
  document.getElementById('status-selector').value = todo.status; // Set the status selector to the current status
  document.getElementById('category-selector').value = todo.category; // Set the category selector to the current category
  modal.style.display = 'block'; // Show the modal
  currentTodoId = todo.uuid;
  deleteButton.style.display = 'block';
  importantCheckbox.checked = todo.important;

  // Set the category icon
  const categoryIcon = document.querySelector('.category-icon'); // Assuming you have this class in the modal
  if (categoryIcon) {
    const iconMapping = {
      shopping: '/images/shop-icon.svg',
      home: '/images/home-icon.svg',
      work: '/images/work-icon.svg',
      school: '/images/school-icon.svg'
    };
    categoryIcon.src = iconMapping[todo.category] || '/images/edit-icon.svg'; // Set default icon if not found
  }
}

// Set up event listeners
submitButton.addEventListener('click', addTodo);
viewSelector.addEventListener('change', fetchTodos);
sortSelector.addEventListener('change', fetchTodos);

// Search functionality
searchInput.addEventListener('input', function () {
  const searchTerm = searchInput.value.trim().toLowerCase();

  // Clear the existing timer
  clearTimeout(debounceTimer);

  // Set a new timer to debounce the search function
  debounceTimer = setTimeout(async function () {
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
          openEditModal(todo);
          searchModal.style.display = 'none';
        });

        searchResults.appendChild(resultItem);
      });
    }
  }, 300); // Delay of 300ms
});

// Search modal event listeners
searchButton.addEventListener('click', function() {
  searchModal.style.display = 'block';
});

closeSearchModal.addEventListener('click', function() {
  searchModal.style.display = 'none';
});

window.addEventListener('click', function(event) {
  if (event.target === searchModal) {
    searchModal.style.display = 'none';
  }
});

// Fetch todos on page load
fetchTodos();