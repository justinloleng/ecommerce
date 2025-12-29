/**
 * Shared Navigation Component JavaScript
 * Handles mobile menu toggle and navigation interactions
 */

(function() {
  'use strict';

  // Initialize navigation on DOM load
  document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
  });

  /**
   * Initialize mobile menu functionality
   */
  function initMobileMenu() {
    // Create mobile menu toggle button if it doesn't exist
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    // Check if toggle button already exists
    let toggleBtn = navbar.querySelector('.mobile-menu-toggle');
    
    if (!toggleBtn) {
      // Create toggle button
      toggleBtn = document.createElement('button');
      toggleBtn.className = 'mobile-menu-toggle';
      toggleBtn.setAttribute('aria-label', 'Toggle mobile menu');
      toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
      
      // Insert as last child of navbar
      navbar.appendChild(toggleBtn);
    }

    // Get the navigation links container
    const navActions = navbar.querySelector('.navbar-actions') || navbar.querySelector('.nav-links');
    if (!navActions) return;

    // Toggle mobile menu
    toggleBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleMobileMenu(navActions, toggleBtn);
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (navActions.classList.contains('mobile-menu-open')) {
        if (!navbar.contains(e.target)) {
          closeMobileMenu(navActions, toggleBtn);
        }
      }
    });

    // Close menu when clicking on a link
    const navLinks = navActions.querySelectorAll('.nav-btn, .nav-links a');
    navLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
          closeMobileMenu(navActions, toggleBtn);
        }
      });
    });

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        if (window.innerWidth > 768 && navActions.classList.contains('mobile-menu-open')) {
          closeMobileMenu(navActions, toggleBtn);
        }
      }, 250);
    });
  }

  /**
   * Toggle mobile menu open/close
   */
  function toggleMobileMenu(navActions, toggleBtn) {
    const isOpen = navActions.classList.contains('mobile-menu-open');
    
    if (isOpen) {
      closeMobileMenu(navActions, toggleBtn);
    } else {
      openMobileMenu(navActions, toggleBtn);
    }
  }

  /**
   * Open mobile menu
   */
  function openMobileMenu(navActions, toggleBtn) {
    navActions.classList.add('mobile-menu-open');
    toggleBtn.innerHTML = '<i class="fas fa-times"></i>';
    toggleBtn.setAttribute('aria-expanded', 'true');
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close mobile menu
   */
  function closeMobileMenu(navActions, toggleBtn) {
    navActions.classList.remove('mobile-menu-open');
    toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
    toggleBtn.setAttribute('aria-expanded', 'false');
    
    // Restore body scroll
    document.body.style.overflow = '';
  }

  // Export functions for external use if needed
  window.NavigationComponent = {
    initMobileMenu: initMobileMenu
  };
})();
