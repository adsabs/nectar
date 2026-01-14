import { useShepherd } from 'react-shepherd';
import { Step, StepOptions } from 'shepherd.js';
import { offset } from '@floating-ui/react-dom';
import { useRouter } from 'next/router';
import { useBreakpointValue } from '@chakra-ui/react';
import * as Sentry from '@sentry/nextjs';
import { sendGTMEvent } from '@next/third-parties/google';
import { LocalSettings } from '@/types';

export const useTour = (type?: 'home' | 'results' | 'abstract') => {
  const router = useRouter();
  const Shepherd = useShepherd();
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const landingPage = /^(|\/|\/classic-form|\/paper-form)$/;
  const resultsPage = '/search';
  const absPage = /\/abs\//;

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

  const tourType = type
    ? type
    : router.pathname.match(landingPage)
    ? 'home'
    : router.pathname === resultsPage
    ? 'results'
    : router.pathname.match(absPage)
    ? 'abstract'
    : 'none';

  if (tourType === 'home') {
    tour.addSteps(getHomeSteps(isMobile));
  } else if (tourType === 'results') {
    tour.addSteps(getResultsSteps());
  } else if (tourType == 'abstract') {
    tour.addSteps(getAbstractSteps(isMobile));
  }

  tour.on('start', () => {
    if (tourType === 'home') {
      localStorage.setItem(LocalSettings.SEEN_LANDING_TOUR, 'true');
    } else if (tourType === 'results') {
      localStorage.setItem(LocalSettings.SEEN_RESULTS_TOUR, 'true');
    } else if (tourType === 'abstract') {
      localStorage.setItem(LocalSettings.SEEN_ABSTRACT_TOUR, 'true');
    }

    sendGTMEvent({ event: 'tour_start', tour_type: tourType, is_mobile: !!isMobile });
    Sentry.addBreadcrumb({ category: 'tour', message: 'tour_start', level: 'info', data: { tourType, isMobile } });
  });

  tour.on('show', () => {
    const stepId = tour.currentStep?.id;

    if (!stepId) {
      return;
    }

    sendGTMEvent({ event: 'tour_step', tour_type: tourType, step_id: stepId });
    Sentry.addBreadcrumb({ category: 'tour', message: 'tour_step', level: 'info', data: { tourType, stepId } });
  });

  tour.on('complete', () => {
    sendGTMEvent({ event: 'tour_complete', tour_type: tourType });
    Sentry.addBreadcrumb({ category: 'tour', message: 'tour_complete', level: 'info', data: { tourType } });
  });

  tour.on('cancel', () => {
    const stepId = tour.currentStep?.id;
    sendGTMEvent({ event: 'tour_cancel', tour_type: tourType, step_id: stepId });
    Sentry.addBreadcrumb({ category: 'tour', message: 'tour_cancel', level: 'info', data: { tourType, stepId } });
  });
  return { tourType, tour };
};

export const getHomeSteps = (isMobile: boolean) => {
  return [
    {
      id: 'search-input',
      title: 'Search',
      text: 'Enter your search terms; by default, returned results will match all of your terms. Some commonly searched fields will be displayed in the autocomplete. For example, type “collection:” to see available disciplinary collections. Learn more about <a href="https://scixplorer.org/adstoscix" target="_blank">SciX here</a>.',
      attachTo: {
        element: '#tour-search-input',
        on: 'bottom',
      },
      classes: 'example-step-extra-class',
      floatingUIOptions: {
        middleware: [offset(10)],
      },
      buttons: [
        {
          text: 'Next',
          action: function () {
            this.next();
          },
        },
      ],
    },
    {
      id: 'theme-selector',
      title: 'Change discipline',
      text: 'Select a discipline to change the SciX home page and results layout. In addition, records from your selected discipline will be boosted when results are sorted by Relevancy.',
      attachTo: {
        element: '#tour-theme-selector',
        on: 'bottom',
      },
      classes: 'example-step-extra-class',
      floatingUIOptions: {
        middleware: [offset(10)],
      },
      buttons: [
        {
          text: 'Prev',
          action: function () {
            this.back();
          },
        },
        {
          text: 'Next',
          action: function () {
            this.next();
          },
        },
      ],
    },
    {
      id: 'quick-fields',
      title: 'Quick fields',
      text: 'For a more targeted search, select the specific field(s) that you want to search, e.g. “author”.',
      attachTo: {
        element: '#quick-fields',
        on: 'bottom',
      },
      classes: 'example-step-extra-class',
      floatingUIOptions: {
        middleware: [offset(10)],
      },
      buttons: [
        {
          text: 'Prev',
          action: function () {
            this.back();
          },
        },
        {
          text: 'Next',
          action: function () {
            this.next();
          },
        },
      ],
      showOn() {
        const el = document.querySelector('#quick-fields');
        return !!el && window.getComputedStyle(el).display !== 'none';
      },
    },
    {
      id: 'all-search-terms',
      title: 'All search terms',
      text: 'A list of all search fields is available for browsing.',
      attachTo: {
        element: '#all-search-terms',
        on: 'bottom',
      },
      classes: 'example-step-extra-class',
      floatingUIOptions: {
        middleware: [offset(10)],
      },
      buttons: [
        {
          text: 'Prev',
          action: function () {
            this.back();
          },
        },
        {
          text: 'Next',
          action: function () {
            this.next();
          },
        },
      ],
    },
    {
      id: 'help-pages',
      title: 'Help pages',
      text: 'Our full help pages can be found here.',
      attachTo: {
        element: isMobile ? 'button[data-id="tour-main-menu"]' : 'button[data-id="tour-help-menu"]',
        on: 'bottom',
      },
      classes: 'example-step-extra-class',
      floatingUIOptions: {
        middleware: [offset(10)],
      },
      buttons: [
        {
          text: 'Prev',
          action: function () {
            this.back();
          },
        },
        {
          text: 'Close',
          action: function () {
            this.next();
          },
        },
      ],
    },
  ] as StepOptions[] | Step[];
};

export const getResultsSteps = () => {
  return [
    {
      id: 'sort-order',
      title: 'Sort order',
      text: 'Change the sort order to rerank results according to different metadata fields or metrics.',
      attachTo: {
        element: '#sort-order',
        on: 'bottom',
      },
      classes: 'example-step-extra-class',
      floatingUIOptions: {
        middleware: [offset(10)],
      },
      buttons: [
        {
          text: 'Next',
          action: function () {
            this.next();
          },
        },
      ],
    },
    {
      id: 'theme-selector',
      title: 'Change discipline',
      text: 'Records from your selected discipline will be boosted when results are sorted by Relevancy.',
      attachTo: {
        element: '#tour-theme-selector',
        on: 'bottom',
      },
      classes: 'example-step-extra-class',
      floatingUIOptions: {
        middleware: [offset(10)],
      },
      buttons: [
        {
          text: 'Prev',
          action: function () {
            this.back();
          },
        },
        {
          text: 'Next',
          action: function () {
            this.next();
          },
        },
      ],
    },
    {
      id: 'filters',
      title: 'filters',
      text: 'Filter your results using the panel: open a particular facet and select one or more options to filter the results',
      attachTo: {
        element: '#tour-search-facets',
        on: 'right',
      },
      classes: 'example-step-extra-class',
      floatingUIOptions: {
        middleware: [offset(10)],
      },
      buttons: [
        {
          text: 'Prev',
          action: function () {
            this.back();
          },
        },
        {
          text: 'Next',
          action: function () {
            this.next();
          },
        },
      ],
    },
    {
      id: 'quick-icons',
      title: 'Quick icons',
      text: 'Quickly view available links for each resource (fulltext sources, citations and references, or data products), or share or cite a paper.',
      attachTo: {
        element: '#tour-quick-icons',
        on: 'bottom',
      },
      classes: 'example-step-extra-class',
      floatingUIOptions: {
        middleware: [offset(10)],
      },
      buttons: [
        {
          text: 'Prev',
          action: function () {
            this.back();
          },
        },
        {
          text: 'Next',
          action: function () {
            this.next();
          },
        },
      ],
    },
    {
      id: 'view-abstract',
      title: 'View abstract',
      text: 'Click here to view a record’s abstract.',
      attachTo: {
        element: '#tour-view-abstract',
        on: 'bottom',
      },
      classes: 'example-step-extra-class',
      floatingUIOptions: {
        middleware: [offset(10)],
      },
      buttons: [
        {
          text: 'Prev',
          action: function () {
            this.back();
          },
        },
        {
          text: 'Next',
          action: function () {
            this.next();
          },
        },
      ],
    },
    {
      id: 'view-highlights',
      title: 'View highlights',
      text: 'Turn on highlights to see the context of your search terms. Note that the length of returned highlights is limited by publishers.',
      attachTo: {
        element: '#tour-view-highlights',
        on: 'bottom',
      },
      classes: 'example-step-extra-class',
      floatingUIOptions: {
        middleware: [offset(10)],
      },
      buttons: [
        {
          text: 'Prev',
          action: function () {
            this.back();
          },
        },
        {
          text: 'Next',
          action: function () {
            this.next();
          },
        },
      ],
    },
    {
      id: 'bulk-actions',
      title: 'Bulk actions',
      text: 'Click here to export the bibliographic information of selected records. If you’re logged in, you can also save the records to a personal library and share with colleagues.  ',
      attachTo: {
        element: '#menu-button-tour-bulk-actions',
        on: 'bottom',
      },
      classes: 'example-step-extra-class',
      floatingUIOptions: {
        middleware: [offset(10)],
      },
      buttons: [
        {
          text: 'Prev',
          action: function () {
            this.back();
          },
        },
        {
          text: 'Next',
          action: function () {
            this.next();
          },
        },
      ],
    },
    {
      id: 'explore',
      title: 'Explore',
      text: 'Click here to visualize your search results and find other relevant papers.',
      attachTo: {
        element: '#menu-button-tour-explore',
        on: 'bottom',
      },
      classes: 'example-step-extra-class',
      floatingUIOptions: {
        middleware: [offset(10)],
      },
      buttons: [
        {
          text: 'Prev',
          action: function () {
            this.back();
          },
        },
        {
          text: 'Next',
          action: function () {
            this.next();
          },
        },
      ],
    },
    {
      id: 'email-notification',
      title: 'Email notification',
      text: 'Turn on email notifications for this query. This will generate daily or weekly emails which include new results',
      attachTo: {
        element: 'button[data-id="tour-email-notification"]',
        on: 'bottom',
      },
      classes: 'example-step-extra-class',
      floatingUIOptions: {
        middleware: [offset(10)],
      },
      buttons: [
        {
          text: 'Prev',
          action: function () {
            this.back();
          },
        },
        {
          text: 'Close',
          action: function () {
            this.next();
          },
        },
      ],
    },
  ] as StepOptions[] | Step[];
};

export const getAbstractSteps = (isMobile: boolean) => {
  return [
    {
      id: 'full-text-sources',
      title: 'Full text sources',
      text: 'Links out to full text versions of this item, possibly including publisher records, preprints, scans of historical materials, or links via your institution’s library.',
      attachTo: {
        element: isMobile ? '#menu-button-tour-full-text-sources' : '#accordion-button-tour-full-text-sources',
        on: isMobile ? 'bottom' : 'right',
      },
      classes: 'example-step-extra-class',
      floatingUIOptions: {
        middleware: [offset(10)],
      },
      buttons: [
        {
          text: 'Next',
          action: function () {
            this.next();
          },
        },
      ],
      showOn() {
        return !!document.querySelector(
          isMobile ? '#menu-button-tour-full-text-sources' : '#accordion-button-tour-full-text-sources',
        );
      },
    },
    {
      id: 'data-products',
      title: 'Data products, related materials',
      text: 'External links to related data products and software, or to related records within SciX.',
      attachTo: {
        element: isMobile ? '#menu-button-tour-data-products' : '#accordion-button-tour-data-products',
        on: isMobile ? 'bottom' : 'right',
      },
      classes: 'example-step-extra-class',
      floatingUIOptions: {
        middleware: [offset(10)],
      },
      buttons: [
        {
          text: 'Prev',
          action: function () {
            this.back();
          },
        },
        {
          text: 'Next',
          action: function () {
            this.next();
          },
        },
      ],
      showOn() {
        return !!document.querySelector(
          isMobile ? '#menu-button-tour-data-products' : '#accordion-button-tour-data-products',
        );
      },
    },
    {
      id: 'navigation',
      title: 'abstract navigation',
      text: 'Find more information about the record, including citations, references, or related records, view usage metrics, or export the bibliographic data in a variety of formats.',
      attachTo: {
        element: '#abstract-nav-menu',
        on: isMobile ? 'bottom' : 'right',
      },
      classes: 'example-step-extra-class',
      floatingUIOptions: {
        middleware: [offset(10)],
      },
      buttons: [
        {
          text: 'Prev',
          action: function () {
            this.back();
          },
        },
        {
          text: 'Next',
          action: function () {
            this.next();
          },
        },
      ],
    },
    {
      id: 'authors-list',
      title: 'Authors list',
      text: 'Click an author’s name or their ORCID icon to search by their name or ORCID ID.',
      attachTo: {
        element: '#tour-authors-list',
        on: 'bottom',
      },
      classes: 'example-step-extra-class',
      floatingUIOptions: {
        middleware: [offset(10)],
      },
      buttons: [
        {
          text: 'Prev',
          action: function () {
            this.back();
          },
        },
        {
          text: 'Next',
          action: function () {
            this.next();
          },
        },
      ],
      showOn() {
        return !!document.querySelector('#tour-authors-list');
      },
    },
    {
      id: 'quick-citation-copy',
      title: 'Quick citation copy',
      text: 'Copy the formatted citation, ready to paste into your text editor.',
      attachTo: {
        element: '#tour-quick-citation-copy',
        on: 'bottom',
      },
      classes: 'example-step-extra-class',
      floatingUIOptions: {
        middleware: [offset(10)],
      },
      buttons: [
        {
          text: 'Prev',
          action: function () {
            this.back();
          },
        },
        {
          text: 'Next',
          action: function () {
            this.next();
          },
        },
      ],
      showOn() {
        return !!document.querySelector('#tour-quick-citation-copy');
      },
    },
    {
      id: 'add-to-library',
      title: 'Add to library',
      text: 'Add this record to one of your personal SciX libraries.',
      attachTo: {
        element: '#tour-add-to-library',
        on: 'bottom',
      },
      classes: 'example-step-extra-class',
      floatingUIOptions: {
        middleware: [offset(10)],
      },
      showOn() {
        return !!document.querySelector('#tour-add-to-library');
      },
      buttons: [
        {
          text: 'Prev',
          action: function () {
            this.back();
          },
        },
        {
          text: 'Close',
          action: function () {
            this.complete();
          },
        },
      ],
    },
    {
      id: 'log-in',
      title: 'Get more by logging in',
      text: ' Set your institutional library, add records to your personal SciX libraries and share with colleagues, or set other customizations with a free SciX account.',
      attachTo: {
        element: isMobile ? 'button[data-id="tour-main-menu"]' : '#menu-button-nav-menu-account',
        on: 'bottom',
      },
      classes: 'example-step-extra-class',
      floatingUIOptions: {
        middleware: [offset(10)],
      },
      showOn() {
        return !!document.querySelector(
          isMobile ? 'button[data-id="tour-main-menu"]' : '#menu-button-nav-menu-account',
        );
      },
      buttons: [
        {
          text: 'Prev',
          action: function () {
            this.back();
          },
        },
        {
          text: 'Close',
          action: function () {
            this.complete();
          },
        },
      ],
    },
  ] as StepOptions[] | Step[];
};
