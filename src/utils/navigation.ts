import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Custom hook to handle smooth scrolling to sections within the home page,
 * including navigation from secondary pages (like /componi-poke).
 */
export function useSectionNavigate() {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateToSection = (sectionId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    const targetHash = `#${sectionId}`;

    if (location.pathname !== '/') {
      navigate(`/${targetHash}`);
      // Fallback scroll if route transition is instant
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else if (sectionId === 'hero') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    } else {
      if (sectionId === 'hero') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
      window.history.pushState(null, '', `/${targetHash}`);
    }
  };

  return { navigateToSection };
}
