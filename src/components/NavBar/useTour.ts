import { useShepherd } from 'react-shepherd';
import { Step, StepOptions } from 'shepherd.js';
import { offset } from '@floating-ui/react-dom';
import { useRouter } from 'next/router';
import { useBreakpointValue } from '@chakra-ui/react';
import * as Sentry from '@sentry/nextjs';
import { sendGTMEvent } from '@next/third-parties/google';
import { LocalSettings } from '@/types';
import { useStore } from '@/store';

export const useTour = (type?: 'home' | 'results' | 'abstract') => {
  const router = useRouter();
  const appMode = useStore((state) => state.mode);
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
    tour.addSteps(getHomeSteps(isMobile, appMode === 'ASTROPHYSICS'));
  } else if (tourType === 'results') {
    tour.addSteps(getResultsSteps(appMode === 'ASTROPHYSICS'));
  } else if (tourType == 'abstract') {
    tour.addSteps(getAbstractSteps(isMobile, appMode === 'ASTROPHYSICS'));
  }

  const listener = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('.shepherd-modal-overlay-container')) {
      tour.cancel();
    }
  };

  tour.on('start', () => {
    if (tourType === 'home') {
      localStorage.setItem(LocalSettings.SEEN_LANDING_TOUR, 'true');
    } else if (tourType === 'results') {
      localStorage.setItem(LocalSettings.SEEN_RESULTS_TOUR, 'true');
    } else if (tourType === 'abstract') {
      localStorage.setItem(LocalSettings.SEEN_ABSTRACT_TOUR, 'true');
    }

    document.addEventListener('click', listener);

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
    document.removeEventListener('click', listener);
    sendGTMEvent({ event: 'tour_complete', tour_type: tourType });
    Sentry.addBreadcrumb({ category: 'tour', message: 'tour_complete', level: 'info', data: { tourType } });
  });

  tour.on('cancel', () => {
    document.removeEventListener('click', listener);
    const stepId = tour.currentStep?.id;
    sendGTMEvent({ event: 'tour_cancel', tour_type: tourType, step_id: stepId });
    Sentry.addBreadcrumb({ category: 'tour', message: 'tour_cancel', level: 'info', data: { tourType, stepId } });
  });
  return { tourType, tour };
};

export const getHomeSteps = (isMobile: boolean, isAstrophysics = false) => {
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
      text: isAstrophysics
        ? 'SciX searches ALL disciplines not just astronomy and physics. Select a discipline to boost records from that discipline in your results when they are sorted by Relevancy. Changing this selection will also customize the SciX home page and results layout.'
        : 'Select a discipline to change the SciX home page and results layout. In addition, records from your selected discipline will be boosted when results are sorted by Relevancy.',
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
      id: 'classic-form-tab',
      title: 'Classic Form',
      text: 'If you are more comfortable with the Classic form, it is still here for you.',
      attachTo: {
        element: '#tour-classic-form-tab',
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
        const el = document.querySelector('#tour-classic-form-tab');
        return isAstrophysics && !!el && window.getComputedStyle(el).display !== 'none';
      },
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
      id: 'account',
      title: 'Account',
      text: 'Log into the SciX website using your ADS credentials. Your existing libraries, notifications, and settings will be available immediately plus you will have a few more options to customize your experience.',
      attachTo: {
        element: isMobile ? 'button[data-id="tour-main-menu"]' : 'div[data-id="tour-account-menu"]',
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
        return isAstrophysics;
      },
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

export const getResultsSteps = (isAstrophysics = false) => {
  return [
    {
      id: 'sort-order',
      title: 'Sort order',
      text: isAstrophysics
        ? 'SciX default order is Relevancy, which will prioritize results from your selected discipline. However, like in ADS, you can change the sort order to rerank results according to different metadata fields or metrics.'
        : 'Change the sort order to rerank results according to different metadata fields or metrics.',
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
      text: isAstrophysics
        ? 'SciX searches ALL disciplines not just astronomy and physics. Select a discipline to boost records from that discipline in your results when they are sorted by Relevancy. '
        : 'Records from your selected discipline will be boosted when results are sorted by Relevancy.',
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
      text: isAstrophysics
        ? 'Like in ADS, you can quickly view available links for each resource (fulltext sources, citations and references, or data products). Now, you can also quickly share or cite a paper.'
        : 'Quickly view available links for each resource (fulltext sources, citations and references, or data products), or share or cite a paper.',
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
      text: isAstrophysics
        ? 'Instead of opening all abstracts, SciX keeps your results compact. Click here to view the abstracts you choose.'
        : 'Click here to view a record’s abstract.',
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
      text: isAstrophysics
        ? 'Turn on highlights to see the context of your search terms. Note the publishers limit the length of the returned highlights.'
        : 'Turn on highlights to see the context of your search terms. Note that the length of returned highlights is limited by publishers.',
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
      text: isAstrophysics
        ? 'Click here to export the bibliographic information of selected records. Here is, also, where you save records to your personal library.'
        : 'Click here to export the bibliographic information of selected records. If you’re logged in, you can also save the records to a personal library and share with colleagues.',
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
      text: isAstrophysics
        ? 'Like in ADS, click here to visualize your search results and find other relevant papers. SciX has new Overview visualizations and the Citation Helper is now available here. '
        : 'Click here to visualize your search results and find other relevant papers.',
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

export const getAbstractSteps = (isMobile: boolean, isAstrophysics = false) => {
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
      text: isAstrophysics
        ? 'Data Products like on ADS plus new Related Materials provide external links to data, software, and other resources either as external links or records within SciX.'
        : 'External links to related data products and software, or to related records within SciX.',
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
      title: 'Abstract navigation',
      text: isAstrophysics
        ? 'Like on ADS find more information about record, including citations, references, or related records, view graphics and usage metrics, or export the bibliographic data in a variety of formats. SciX also goes beyond reference lists to reveal scientific contributions of data, software, and support as credits and mentions.'
        : 'Find more information about the record, including citations, references, or related records, view usage metrics, or export the bibliographic data in a variety of formats.',
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
      text: isAstrophysics
        ? 'Click an author’s name or their ORCID icon to search by their name or ORCID ID. Click “show details” for a searchable panel of authors, ORCiD, and affiliations. '
        : 'Click an author’s name or their ORCID icon to search by their name or ORCID ID.',
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
      id: 'document-type',
      title: 'Document Type',
      text: 'Type of document explicitly stated (article, dataset, catalog, software, proposal, phdthesis… ) You can also filter for these using Publication Type or search for them using "doctype:" ',
      attachTo: {
        element: '#tour_abs_doctype',
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
        return isAstrophysics && !!document.querySelector('#tour_abs_doctype');
      },
    },
    {
      id: 'quick-citation-copy',
      title: 'Quick citation copy',
      text: isAstrophysics
        ? 'Copy the formatted citation, ready to paste into your text editor. Set your default format in your SciX account.'
        : 'Copy the formatted citation, ready to paste into your text editor.',
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
      id: 'collections',
      title: 'Collections',
      text: 'Collections (astronomy, earthscience, physics, or general) to which record belongs explicitly stated, more than one is possible. You can filter for these using Collections filter or search for them using "collection:"',
      attachTo: {
        element: '#tour-abs-collections',
        on: 'top',
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
        return isAstrophysics && !!document.querySelector('#tour-abs-collections');
      },
    },
    {
      id: 'uat-keywords',
      title: 'UAT keywords',
      text: 'SciX machine learning project to assign a consistent set of keywords to all astronomy records. Your feedback would be appreciated.',
      attachTo: {
        element: '#tour-abs-uat-keywords',
        on: 'top',
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
        return isAstrophysics && !!document.querySelector('#tour-abs-uat-keywords');
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
      text: 'Set your institutional library, add records to your personal SciX libraries and share with colleagues, or set other customizations with a free SciX account.',
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
