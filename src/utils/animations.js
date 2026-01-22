/**
 * Animation Utilities
 * Helper functions for smooth animations and transitions
 */

/**
 * Stagger animation for list items
 * @param {number} index - Item index
 * @param {number} delay - Base delay in ms
 * @returns {object} Style object with animation delay
 */
export const staggerAnimation = (index, delay = 100) => ({
  animationDelay: `${index * delay}ms`,
});

/**
 * Fade in animation style - Optimized timing (200ms)
 * @param {number} delay - Delay in ms
 * @returns {object} Style object
 */
export const fadeIn = (delay = 0) => ({
  animation: `fade-in 0.2s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms both`,
});

/**
 * Slide up animation style - Optimized timing (200ms)
 * @param {number} delay - Delay in ms
 * @returns {object} Style object
 */
export const slideUp = (delay = 0) => ({
  animation: `slide-up 0.2s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms both`,
});

/**
 * Scale in animation style - Optimized timing (150ms)
 * @param {number} delay - Delay in ms
 * @returns {object} Style object
 */
export const scaleIn = (delay = 0) => ({
  animation: `scale-in 0.15s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms both`,
});

/**
 * Intersection Observer for scroll animations
 * @param {Function} callback - Callback when element enters viewport
 * @param {object} options - IntersectionObserver options
 * @returns {Function} Function to observe an element
 */
export const createScrollAnimation = (callback, options = {}) => {
  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
    ...options,
  };

  return (element) => {
    if (!element) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, defaultOptions);

    observer.observe(element);
    return () => observer.disconnect();
  };
};

/**
 * Smooth scroll to element
 * @param {string} elementId - ID of element to scroll to
 * @param {object} options - Scroll options
 */
export const smoothScrollTo = (elementId, options = {}) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const defaultOptions = {
    behavior: 'smooth',
    block: 'start',
    ...options,
  };

  element.scrollIntoView(defaultOptions);
};

/**
 * Animate number counter - Optimized timing (300ms max)
 * @param {number} from - Start value
 * @param {number} to - End value
 * @param {number} duration - Duration in ms (default 300ms)
 * @param {Function} callback - Callback with current value
 */
export const animateCounter = (from, to, duration = 300, callback) => {
  // Respect reduced motion
  if (prefersReducedMotion()) {
    callback(to);
    return;
  }

  const startTime = performance.now();
  const difference = to - from;

  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function (ease-out) - smooth, natural
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(from + difference * easeOut);
    
    callback(current);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
};

/**
 * Debounce function for animations
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for animations
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Check if user prefers reduced motion
 * @returns {boolean}
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Conditional animation based on user preference
 * @param {string} animationClass - Animation class to apply
 * @returns {string} Animation class or empty string
 */
export const getAnimationClass = (animationClass) => {
  if (prefersReducedMotion()) {
    return '';
  }
  return animationClass;
};
