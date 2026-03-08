/* Solaris CET - App Styles */

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #05060B;
}

::-webkit-scrollbar-thumb {
  background: rgba(242, 201, 76, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(242, 201, 76, 0.5);
}

/* Selection */
::selection {
  background: rgba(242, 201, 76, 0.3);
  color: #F4F6FF;
}

/* Range input styling */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

input[type="range"]::-webkit-slider-track {
  background: rgba(255, 255, 255, 0.1);
  height: 8px;
  border-radius: 4px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  background: #F2C94C;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  margin-top: -6px;
  box-shadow: 0 0 10px rgba(242, 201, 76, 0.5);
  transition: transform 0.2s, box-shadow 0.2s;
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 0 15px rgba(242, 201, 76, 0.7);
}

input[type="range"]::-moz-range-track {
  background: rgba(255, 255, 255, 0.1);
  height: 8px;
  border-radius: 4px;
}

input[type="range"]::-moz-range-thumb {
  background: #F2C94C;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  border: none;
  box-shadow: 0 0 10px rgba(242, 201, 76, 0.5);
}

/* Gradient radial utility */
.bg-gradient-radial {
  background: radial-gradient(circle, var(--tw-gradient-from), var(--tw-gradient-to));
}

/* Smooth transitions for all interactive elements */
button, a, input {
  transition: all 0.3s ease;
}

/* Focus states */
button:focus-visible,
a:focus-visible,
input:focus-visible {
  outline: 2px solid #F2C94C;
  outline-offset: 2px;
}

/* Prevent text selection on interactive elements */
button, .btn-gold, .btn-filled-gold {
  user-select: none;
}

/* Glass card hover enhancement */
.glass-card:hover {
  background: rgba(244, 246, 255, 0.06);
  border-color: rgba(244, 246, 255, 0.15);
}

/* Animation for loading states */
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 8s linear infinite;
}

/* Responsive typography adjustments */
@media (max-width: 640px) {
  .section-pinned {
    min-height: 100vh;
    min-height: 100dvh;
  }
}

/* Reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .animate-coin-rotate,
  .animate-float,
  .animate-pulse-glow,
  .animate-ticker {
    animation: none !important;
  }
}
