import { useEffect, useState } from 'react';
import { useShepherd } from 'react-shepherd';

import { getResultsSteps } from '@/components/NavBar';
import { LocalSettings } from '@/types';

// starts the search-results tour the first time the results list renders
export const useSearchResultsTour = () => {
  const Shepherd = useShepherd();
  const [isRendered, setIsRendered] = useState(false);

  // tour should not start until the first element is rendered
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const element = document.getElementById('sort-order');
      if (element) {
        setIsRendered(true);
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isRendered && !localStorage.getItem(LocalSettings.SEEN_RESULTS_TOUR)) {
      const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
          scrollTo: false,
          cancelIcon: {
            enabled: true,
          },
        },
        exitOnEsc: true,
      });
      tour.addSteps(getResultsSteps());
      localStorage.setItem(LocalSettings.SEEN_RESULTS_TOUR, 'true');

      const listener = (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest('.shepherd-modal-overlay-container')) {
          tour.cancel();
        }
      };
      tour.on('start', () => {
        document.addEventListener('click', listener);
      });
      tour.on('cancel', () => {
        document.removeEventListener('click', listener);
      });
      tour.on('complete', () => {
        document.removeEventListener('click', listener);
      });

      setTimeout(() => {
        tour.start();
      }, 1000);
    }
  }, [isRendered, Shepherd]);
};
