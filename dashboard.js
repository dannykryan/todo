import { createClient } from '@supabase/supabase-js';
import * as d3 from 'd3';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const categorySummary = document.getElementById('category-summary');
const statusSummary = document.getElementById('status-summary');
const highPriorityCount = document.getElementById('high-priority-count');

// Fetch todos and populate the dashboard
async function populateDashboard() {
  const { data: todos, error } = await supabase.from('todos').select('*');
  if (error) {
    console.error('Error fetching todos:', error);
    return;
  }

  // Summarize tasks by category
  const categoryCounts = todos.reduce((acc, todo) => {
    acc[todo.category] = (acc[todo.category] || 0) + 1;
    return acc;
  }, {});

  categorySummary.innerHTML = Object.entries(categoryCounts)
    .map(([category, count]) => `<li>${category}: ${count}</li>`)
    .join('');

  // Summarize tasks by status
  const statusCounts = todos.reduce((acc, todo) => {
    acc[todo.status] = (acc[todo.status] || 0) + 1;
    return acc;
  }, {});

  statusSummary.innerHTML = Object.entries(statusCounts)
    .map(([status, count]) => `<li>${status}: ${count}</li>`)
    .join('');

  // Count high-priority tasks
  const highPriorityTasks = todos.filter((todo) => todo.important).length;
  highPriorityCount.textContent = `${highPriorityTasks} tasks`;

  // Draw pie chart for status distribution
  drawPieChart(statusCounts);
}

// Draw a pie chart using D3.js
function drawPieChart(data) {
  const width = 200;
  const height = 200;
  const radius = Math.min(width, height) / 2;
  const colors = d3.scaleOrdinal(d3.schemeCategory10);

  const svg = d3
    .select('#pie-chart')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2})`);

  const pie = d3.pie().value((d) => d[1]);
  const arcs = pie(Object.entries(data));

  const arcGenerator = d3.arc().innerRadius(0).outerRadius(radius);

  svg
    .selectAll('path')
    .data(arcs)
    .enter()
    .append('path')
    .attr('d', arcGenerator)
    .attr('fill', (d, i) => colors(i))
    .attr('stroke', '#fff')
    .attr('stroke-width', 2);

  // Add labels
  svg
    .selectAll('text')
    .data(arcs)
    .enter()
    .append('text')
    .attr('transform', (d) => `translate(${arcGenerator.centroid(d)})`)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .text((d) => d.data[0]);
}

populateDashboard();
