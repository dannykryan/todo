(function() {
  // Set some variables
  let todos = [];

  // Get HTML Elements
  const loader = document.querySelector('.loader');

  const getTodos = () => {
    // update the todos vairable
    loader.classList.remove('hidden');
    loader.classList.add('visible');

    // Do your updating

    loader.classList.add('hidden');
    loader.classList.remove('visible');
  }

  const renderTodos = () => {
    // Render on the front end
  }

  const addTodos = () => {
    // Update todos in the DB
  }

  const handleUpdateTodos = async (newTodos) => {
    // Might be the submission event instead
    const response = await addTodos(newTodos)

    if (respone.status === 201) {
      await getTodos()
      await renderTodos();
    }
  }


  const init = async () => {
    await getTodos();
    await renderTodos();
  }

  init()
})()