// Global variables
let currentUser = null;
let plantCollection = JSON.parse(localStorage.getItem('plantCollection')) || [];

// Initialize the application
$(document).ready(function() {
  initializeApp();
  setupEventListeners();
  checkAuthStatus();
});

// Initialize Netlify Identity
function initializeApp() {
  if (window.netlifyIdentity) {
    window.netlifyIdentity.on("init", user => {
      if (user) {
        currentUser = user;
        showMainApp();
      } else {
        showAuthModal();
      }
    });
    
    window.netlifyIdentity.on("login", user => {
      currentUser = user;
      showMainApp();
    });
    
    window.netlifyIdentity.on("logout", () => {
      currentUser = null;
      showAuthModal();
    });
  }
}

// Setup event listeners
function setupEventListeners() {
  // Auth form toggles
  $("#show-login").click(function(e) {
    e.preventDefault();
    $(".register-form").hide();
    $(".login-form").show();
  });
  
  $("#show-register").click(function(e) {
    e.preventDefault();
    $(".login-form").hide();
    $(".register-form").show();
  });
  
  // Auth form submissions
  $(".login-form").submit(function(e) {
    e.preventDefault();
    const email = $(this).find('input[type="email"]').val();
    const password = $(this).find('input[type="password"]').val();
    loginUser(email, password);
  });
  
  $(".register-form").submit(function(e) {
    e.preventDefault();
    const name = $(this).find('input[type="text"]').val();
    const email = $(this).find('input[type="email"]').val();
    const password = $(this).find('input[type="password"]').val();
    registerUser(name, email, password);
  });
  
  // Navigation
  $(".nav-link").click(function(e) {
    e.preventDefault();
    const target = $(this).attr('href').substring(1);
    showSection(target);
    $(".nav-link").removeClass('active');
    $(this).addClass('active');
  });
  
  // CTA button
  $("#start-identify").click(function() {
    showSection('identify');
    $(".nav-link").removeClass('active');
    $('a[href="#identify"]').addClass('active');
  });
  
  // Image upload
  $("#image-input").change(handleImageUpload);
  
  // Drag and drop
  const uploadArea = document.getElementById('upload-area');
  uploadArea.addEventListener('dragover', handleDragOver);
  uploadArea.addEventListener('dragleave', handleDragLeave);
  uploadArea.addEventListener('drop', handleDrop);
  uploadArea.addEventListener('click', () => document.getElementById('image-input').click());
  
  // Image actions
  $("#identify-btn").click(identifyPlant);
  $("#remove-image").click(removeImage);
  
  // Logout
  $("#logout-btn").click(logout);
}

// Check authentication status
function checkAuthStatus() {
  if (window.netlifyIdentity) {
    const user = window.netlifyIdentity.currentUser();
    if (user) {
      currentUser = user;
      showMainApp();
    } else {
      showAuthModal();
    }
  } else {
    // Fallback for development
    showAuthModal();
  }
}

// Show auth modal
function showAuthModal() {
  $("#auth-modal").show();
  $("#main-app").addClass('hidden');
}

// Show main app
function showMainApp() {
  $("#auth-modal").hide();
  $("#main-app").removeClass('hidden');
  $("#user-email").text(currentUser?.email || 'User');
  loadPlantCollection();
}

// Login user
function loginUser(email, password) {
  if (window.netlifyIdentity) {
    window.netlifyIdentity.open('login');
  } else {
    // Fallback for development
    alert('Netlify Identity not loaded. This will work when deployed to Netlify.');
  }
}

// Register user
function registerUser(name, email, password) {
  if (window.netlifyIdentity) {
    window.netlifyIdentity.open('signup');
  } else {
    // Fallback for development
    alert('Netlify Identity not loaded. This will work when deployed to Netlify.');
  }
}

// Logout
function logout() {
  if (window.netlifyIdentity) {
    window.netlifyIdentity.logout();
  } else {
    currentUser = null;
    showAuthModal();
  }
}

// Show specific section
function showSection(sectionId) {
  $('.hero-section, .identify-section, .gallery-section').hide();
  $(`#${sectionId}`).show();
}

// Handle image upload
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    displayImagePreview(file);
  }
}

// Handle drag over
function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('dragover');
}

// Handle drag leave
function handleDragLeave(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('dragover');
}

// Handle drop
function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('dragover');
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    displayImagePreview(files[0]);
  }
}

// Display image preview
function displayImagePreview(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    $("#preview-img").attr('src', e.target.result);
    $("#upload-area").hide();
    $("#image-preview").show();
  };
  reader.readAsDataURL(file);
}

// Remove image
function removeImage() {
  $("#image-preview").hide();
  $("#upload-area").show();
  $("#image-input").val('');
  $("#results-container").hide();
}

// Identify plant using PlantNet API
async function identifyPlant() {
  const imageFile = document.getElementById('image-input').files[0];
  if (!imageFile) return;
  
  $("#loading").show();
  $("#results").empty();
  $("#results-container").show();
  
  try {
    // Use real PlantNet API
    const results = await identifyPlantWithAPI(imageFile);
    displayResults(results);
  } catch (error) {
    console.error('Error identifying plant:', error);
    displayError('Failed to identify plant. Please try again.');
  } finally {
    $("#loading").hide();
  }
}

// Mock plant identification (replace with real API)
async function mockPlantIdentification(imageFile) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock results
  return [
    {
      name: "Monstera Deliciosa",
      confidence: 0.95,
      description: "A popular houseplant known for its large, split leaves. Native to tropical forests of Central America.",
      commonNames: ["Swiss Cheese Plant", "Split-leaf Philodendron"]
    },
    {
      name: "Ficus Lyrata",
      confidence: 0.78,
      description: "Also known as the Fiddle Leaf Fig, this plant is prized for its large, violin-shaped leaves.",
      commonNames: ["Fiddle Leaf Fig"]
    },
    {
      name: "Sansevieria Trifasciata",
      confidence: 0.65,
      description: "A hardy succulent plant with tall, sword-like leaves. Very low maintenance and air-purifying.",
      commonNames: ["Snake Plant", "Mother-in-law's Tongue"]
    }
  ];
}

// Display identification results
function displayResults(results) {
  const resultsContainer = $("#results");
  resultsContainer.empty();
  
  // Add success header
  resultsContainer.append(`
    <div class="result-item" style="background: rgba(76, 175, 80, 0.2); border-color: rgba(76, 175, 80, 0.4);">
      <h4 style="color: #4CAF50;">🌱 Plant Identified Successfully!</h4>
      <p>Found ${results.length} possible matches for your plant.</p>
    </div>
  `);
  
  results.forEach((result, index) => {
    const confidenceColor = result.confidence > 0.8 ? '#4CAF50' : result.confidence > 0.6 ? '#FF9800' : '#FF5722';
    const resultHtml = `
      <div class="result-item">
        <h4>${result.name} <span style="color: ${confidenceColor};">(${Math.round(result.confidence * 100)}% confidence)</span></h4>
        <p><strong>Common Names:</strong> ${result.commonNames.length > 0 ? result.commonNames.join(', ') : 'No common names available'}</p>
        <p><strong>Description:</strong> ${result.description}</p>
      </div>
    `;
    resultsContainer.append(resultHtml);
  });
  
  // Save to collection
  if (results.length > 0) {
    const plantData = {
      id: Date.now(),
      name: results[0].name,
      confidence: results[0].confidence,
      image: $("#preview-img").attr('src'),
      date: new Date().toISOString(),
      description: results[0].description
    };
    
    plantCollection.unshift(plantData);
    localStorage.setItem('plantCollection', JSON.stringify(plantCollection));
    loadPlantCollection();
    
    // Show success notification
    showNotification('Plant saved to your collection!', 'success');
  }
}

// Display error
function displayError(message) {
  const resultsContainer = $("#results");
  resultsContainer.html(`
    <div class="result-item">
      <h4 style="color: #ff6b6b;">⚠️ Error</h4>
      <p>${message}</p>
      <p style="font-size: 0.9rem; margin-top: 10px; opacity: 0.8;">
        Please make sure your image shows a clear view of the plant and try again.
      </p>
    </div>
  `);
}

// Load plant collection
function loadPlantCollection() {
  const plantGrid = $("#plant-grid");
  plantGrid.empty();
  
  if (plantCollection.length === 0) {
    plantGrid.html('<div class="empty-state"><p>No plants identified yet. Start by uploading a photo!</p></div>');
    return;
  }
  
  plantCollection.forEach(plant => {
    const plantCard = `
      <div class="plant-card">
        <img src="${plant.image}" alt="${plant.name}">
        <h3>${plant.name}</h3>
        <p>Confidence: ${Math.round(plant.confidence * 100)}%</p>
        <p>${new Date(plant.date).toLocaleDateString()}</p>
      </div>
    `;
    plantGrid.append(plantCard);
  });
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = $(`
    <div class="notification notification-${type}">
      <span>${message}</span>
    </div>
  `);
  
  $('body').append(notification);
  
  setTimeout(() => {
    notification.addClass('show');
  }, 100);
  
  setTimeout(() => {
    notification.removeClass('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Real PlantNet API integration
async function identifyPlantWithAPI(imageFile) {
  const formData = new FormData();
  formData.append('images', imageFile);
  formData.append('organs', 'auto');
  formData.append('modifiers', 'crops');
  formData.append('plant_language', 'en');
  formData.append('plant_details', 'common_names,url,description,image');
  
  try {
    const response = await fetch('https://my-api.plantnet.org/v2/identify', {
      method: 'POST',
      headers: {
        'Api-Key': '2b1035Lj8J69sGoJZJh0foFSTe'
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      throw new Error('No plant identification results found');
    }
    
    return data.results.map(result => ({
      name: result.species.scientificNameWithoutAuthor,
      confidence: result.score,
      description: result.species.description || 'No description available',
      commonNames: result.species.commonNames || []
    }));
  } catch (error) {
    console.error('PlantNet API Error:', error);
    throw error;
  }
}
