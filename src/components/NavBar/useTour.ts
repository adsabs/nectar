import { useShepherd } from 'react-shepherd';
import type { Step, StepOptions } from 'shepherd.js';
import { offset } from '@floating-ui/react-dom';
import { useRouter } from 'next/router';
import { useBreakpointValue } from '@chakra-ui/react';
import * as Sentry from '@sentry/nextjs';
import { sendGTMEvent } from '@next/third-parties/google';
import { LocalSettings } from '@/types';
import { useStore } from '@/store';
import { useMemo } from 'react';

export const useTour = (type?: 'home' | 'results' | 'abstract') => {
  const router = useRouter();
  const appMode = useStore((state) => state.mode);
  const Shepherd = useShepherd();
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const landingPage = /^(|\/|\/classic-form|\/paper-form)$/;
  const resultsPage = '/search';
  const absPage = /\/abs\//;
  const isADSCompatMode = useStore((state) => state.searchMode === 'ADS_COMPAT');

  const tourType = type
    ? type
    : router.pathname.match(landingPage)
    ? 'home'
    : router.pathname === resultsPage
    ? 'results'
    : router.pathname.match(absPage)
    ? 'abstract'
    : 'none';

  const tourObject = useMemo(() => {
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

    if (tourType === 'home') {
      tour.addSteps(getHomeSteps(isMobile, appMode === 'ASTROPHYSICS'));
    } else if (tourType === 'results') {
      tour.addSteps(getResultsSteps(appMode === 'ASTROPHYSICS', isADSCompatMode));
    } else if (tourType == 'abstract') {
      tour.addSteps(getAbstractSteps(isMobile, appMode === 'ASTROPHYSICS'));
    }

    const listener = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.shepherd-modal-overlay-container')) {
        tour.cancel();
      }
    };

    tour.on('start', () => {
      tour.options.keyboardNavigation = true;
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
      tour.options.keyboardNavigation = false;
      document.removeEventListener('click', listener);
      sendGTMEvent({ event: 'tour_complete', tour_type: tourType });
      Sentry.addBreadcrumb({ category: 'tour', message: 'tour_complete', level: 'info', data: { tourType } });

      // give focus back to search input after shepherd cleaned up
      setTimeout(() => {
        document.getElementById('search-input')?.focus();
      }, 0);
    });

    tour.on('cancel', () => {
      tour.options.keyboardNavigation = false;
      document.removeEventListener('click', listener);
      const stepId = tour.currentStep?.id;
      sendGTMEvent({ event: 'tour_cancel', tour_type: tourType, step_id: stepId });
      Sentry.addBreadcrumb({ category: 'tour', message: 'tour_cancel', level: 'info', data: { tourType, stepId } });

      // give focus back to search input after shepherd cleaned up
      setTimeout(() => {
        document.getElementById('search-input')?.focus();
      }, 0);
    });
    return { tourType, tour };
  }, [Shepherd.Tour, tourType, isMobile, appMode]);

  return tourObject;
};

export const getHomeSteps = (isMobile: boolean, isAstrophysics = false) => {
  return [
    {
      id: 'search-input',
      title: isAstrophysics
        ? '<span class="tour-title">Search<span class="tour-badge-old">Same as ADS</span></span>'
        : 'Search',
      text: `${
        isAstrophysics ? '<i>If you are familiar with this screen, click X to exit the tour.</i><br/><br/>' : ''
      }<p>Enter your search terms; by default, returned results will match all of your terms. Some commonly searched fields will be displayed in the autocomplete. For example, type <code>collection:</code> to see available disciplinary collections. Learn more about <a href="https://scixplorer.org/adstoscix" target="_blank">SciX here</a>.</p>`,
      attachTo: {
        element: '[data-tour="search-input"]',
        on: 'bottom',
      },
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
      title: isAstrophysics
        ? '<span class="tour-title">Change discipline<span class="tour-badge">✦ New Feature</span></span>'
        : 'Change discipline',
      text: isAstrophysics
        ? 'SciX searches ALL available content, not just the Astronomy and Physics Collections. Select a discipline to boost records from related collections in your results when sorting by Relevance. Your choice will also customize the SciX home page and results layout. For instance, the Classic Form is only available when the Astrophysics discipline is selected.'
        : 'Select a discipline to change the SciX home page and results layout. In addition, records from your selected discipline will be boosted when results are sorted by Relevancy.',
      attachTo: {
        element: '#theme-selector',
        on: 'bottom',
      },
      classes: isAstrophysics ? 'tour-step-new' : '',
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
      id: 'search-mode',
      title: '<span class="tour-title">Change discipline<span class="tour-badge">✦ New Feature</span></span>',
      text: 'The default “All relevant content” searches every collection and sorts results by Relevance; this choice maximizes the power of SciX. Switch to “ADS compatibility mode” to limit your search to the Astronomy and Physics collections and sort your results by date; this choice provides the most ADS-like experience.',
      attachTo: {
        element: '[data-tour="search-mode-dropdown"]',
        on: 'bottom',
      },
      classes: 'tour-step-new',
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
      id: 'classic-form-tab',
      title: isAstrophysics
        ? '<span class="tour-title">Classic Form<span class="tour-badge-old">Same as ADS</span></span>'
        : 'Classic Form',
      text: 'If you are more comfortable with the Classic form, it is still here for you.',
      attachTo: {
        element: '[data-tour="classic-form-tab"]',
        on: 'bottom',
      },
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
        const el = document.querySelector('[data-tour="classic-form-tab"]');
        return isAstrophysics && !!el && window.getComputedStyle(el).display !== 'none';
      },
    },
    {
      id: 'quick-fields',
      title: isAstrophysics
        ? '<span class="tour-title">Quick Field<span class="tour-badge-old">Same as ADS</span></span>'
        : 'Quick Field',
      text: 'For a more targeted search, select the specific field(s) that you want to search, e.g. <code>author</code>.',
      attachTo: {
        element: '[data-tour="quick-fields"]',
        on: 'bottom',
      },
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
        const el = document.querySelector('[data-tour="quick-fields"]');
        return !!el && window.getComputedStyle(el).display !== 'none';
      },
    },
    {
      id: 'all-search-terms',
      title: isAstrophysics
        ? '<span class="tour-title">all search terms<span class="tour-badge-old">Same as ADS</span></span>'
        : 'all search terms',
      text: 'A list of all search fields is available for browsing.',
      attachTo: {
        element: '[data-tour="all-search-terms"]',
        on: 'bottom',
      },
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
      title: isAstrophysics
        ? '<span class="tour-title">Account<span class="tour-badge-old">Same as ADS</span></span>'
        : 'Account',
      text: 'Log into the SciX website using your ADS credentials. Your existing libraries, notifications, and settings will be available immediately plus you will have a few more options to customize your experience.',
      attachTo: {
        element: isMobile ? '[data-tour="main-menu"]' : '[data-tour="account-menu"]',
        on: 'bottom',
      },
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
      title: isAstrophysics
        ? '<span class="tour-title">Help pages<span class="tour-badge-old">Same as ADS</span></span>'
        : 'Help pages',
      text: 'Our full help pages can be found here.',
      attachTo: {
        element: isMobile ? '[data-tour="main-menu"]' : '[data-tour="help-menu"]',
        on: 'bottom',
      },
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

export const getResultsSteps = (isAstrophysics = false, isADSCompatMode = false) => {
  return [
    {
      id: 'sort-order',
      title: isAstrophysics
        ? '<span class="tour-title">Sort order<span class="tour-badge">Updated</span></span>'
        : 'Sort order',
      text: isAstrophysics
        ? 'SciX default order is Relevance, which boosts results from collections related to your selected discipline. However, like in ADS, you can change the sort order to rerank results according to different metadata fields or metrics.'
        : 'Change the sort order to rerank results according to different metadata fields or metrics.',
      attachTo: {
        element: '[data-tour="sort-order"]',
        on: 'bottom',
      },
      classes: isAstrophysics ? 'tour-step-new' : '',
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
      title: isAstrophysics
        ? '<span class="tour-title">Change discipline<span class="tour-badge">✦ New Feature</span></span>'
        : 'Change discipline',
      text: isAstrophysics
        ? 'SciX searches ALL available content, not just the Astronomy and Physics Collections. Records from collections related to the selected discipline are boosted when sorted by Relevance. Changing the selected discipline will rerank Relevance-sorted results providing different views of the literature.'
        : 'Records from your selected discipline will be boosted when results are sorted by Relevancy.',
      attachTo: {
        element: '#theme-selector',
        on: 'bottom',
      },
      classes: isAstrophysics ? 'tour-step-new' : '',
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
      title: isAstrophysics
        ? '<span class="tour-title">Filters<span class="tour-badge-old">Same as ADS</span></span>'
        : 'Filters',
      text: 'Filter your results using the panel: open a particular facet and select one or more options to either limit to or exclude. ',
      attachTo: {
        element: '[data-tour="search-facets"]',
        on: 'right',
      },
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
      title: isAstrophysics
        ? '<span class="tour-title">Quick icons<span class="tour-badge">Updated</span></span>'
        : 'Quick icons',
      text: isAstrophysics
        ? 'Like in ADS, you can quickly view available links for each resource (fulltext sources, citations and references, or data products). Now, you can also quickly share or cite a paper.'
        : 'Quickly view available links for each resource (fulltext sources, citations and references, or data products), or share or cite a paper.',
      attachTo: {
        element: '[data-tour="quick-icons"]',
        on: 'bottom',
      },
      classes: isAstrophysics ? 'tour-step-new' : '',
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
      title: isAstrophysics
        ? '<span class="tour-title">View abstract<span class="tour-badge">Updated</span></span>'
        : 'View abstract',
      text: isAstrophysics
        ? 'Instead of opening all abstracts, SciX keeps your results compact. Click here to view the abstracts you choose.'
        : 'Click here to view a record’s abstract.',
      attachTo: {
        element: '[data-tour="view-abstract"]',
        on: 'bottom',
      },
      classes: isAstrophysics ? 'tour-step-new' : '',
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
      title: isAstrophysics
        ? '<span class="tour-title">View highlights<span class="tour-badge-old">Same as ADS</span></span>'
        : 'View highlights',
      text: isAstrophysics
        ? 'Turn on highlights to see the context of your search terms. Note the publishers limit the length of the returned highlights.'
        : 'Turn on highlights to see the context of your search terms. Note that the length of returned highlights is limited by publishers.',
      attachTo: {
        element: '[data-tour="view-highlights"]',
        on: 'bottom',
      },
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
      title: isAstrophysics
        ? '<span class="tour-title">Bulk Actions<span class="tour-badge-old">Same as ADS</span></span>'
        : 'Bulk Actions',
      text: isAstrophysics
        ? 'Click here to export the bibliographic information of selected records. Here is, also, where you save records to your personal library.'
        : 'Click here to export the bibliographic information of selected records. If you’re logged in, you can also save the records to a personal library and share with colleagues.',
      attachTo: {
        element: '[data-tour="bulk-actions"]',
        on: 'bottom',
      },
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
      title: isAstrophysics
        ? '<span class="tour-title">Explore<span class="tour-badge">Updated</span></span>'
        : 'Explore',
      text: isAstrophysics
        ? 'Like in ADS, click here to visualize your search results and find other relevant papers. SciX has new Overview visualizations and the Citation Helper is now available here. '
        : 'Click here to visualize your search results and find other relevant papers.',
      attachTo: {
        element: '[data-tour="explore"]',
        on: 'bottom',
      },
      classes: isAstrophysics ? 'tour-step-new' : '',
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
      title: isAstrophysics
        ? '<span class="tour-title">Email notification<span class="tour-badge-old">Same as ADS</span></span>'
        : 'Email notification',
      text: 'Turn on email notifications for this query. This will generate daily or weekly emails that include new results',
      attachTo: {
        element: '[data-tour="email-notification"]',
        on: 'bottom',
      },
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
          text: isADSCompatMode && !!document.querySelector('[data-tour="facet-filters"]') ? 'Next' : 'Close',
          action: function () {
            this.next();
          },
        },
      ],
    },
    {
      id: 'preset-collection-filters',
      title: '<span class="tour-title">Preset Collection Filters<span class="tour-badge-old">Same as ADS</span></span>',
      text: 'ADS compatibility mode automatically sets your Collection filter to “Astronomy OR Physics.” Remove the Physics collection to further narrow your results to astronomy content. Remove both filters to expand your results to all SciX content. ',
      attachTo: {
        element: '[data-tour="facet-filters"]',
        on: 'bottom',
      },
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
      showOn() {
        const el = document.querySelector('[data-tour="facet-filters"]');
        return isADSCompatMode && !!el && window.getComputedStyle(el).display !== 'none';
      },
    },
  ] as StepOptions[] | Step[];
};

export const getAbstractSteps = (isMobile: boolean, isAstrophysics = false) => {
  return [
    {
      id: 'full-text-sources',
      title: isAstrophysics
        ? '<span class="tour-title">Full Text Sources<span class="tour-badge-old">Same as ADS</span></span>'
        : 'Full Text Sources',
      text: 'Links out to full text versions of this item, possibly including publisher records, preprints, scans of historical materials, or links via your institution’s library.',
      attachTo: {
        element: isMobile ? '[data-tour="full-text-sources-mobile"]' : '[data-tour="full-text-sources-desktop"]',
        on: isMobile ? 'bottom' : 'right',
      },
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
        return (
          !!document.querySelector('[data-tour="full-text-sources-mobile"]') ||
          !!document.querySelector('[data-tour="full-text-sources-desktop"]')
        );
      },
    },
    {
      id: 'data-products',
      title: isAstrophysics
        ? '<span class="tour-title">Data Products, Related Materials<span class="tour-badge-old">Same as ADS</span></span>'
        : 'Data Products, Related Materials',
      text: isAstrophysics
        ? 'Data Products like on ADS plus new Related Materials provide external links to data, software, and other resources either as external links or records within SciX.'
        : 'External links to related data products and software, or to related records within SciX.',
      attachTo: {
        element: isMobile ? '[data-tour="data-products-mobile"]' : '[data-tour="data-products-desktop"]',
        on: isMobile ? 'bottom' : 'right',
      },
      floatingUIOptions: {
        middleware: [offset(10)],
      },
      classes: 'tour-step-wide',
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
          isMobile ? '[data-tour="data-products-mobile"]' : '[data-tour="data-products-desktop"]',
        );
      },
    },
    {
      id: 'navigation',
      title: isAstrophysics
        ? '<span class="tour-title">Abstract navigation<span class="tour-badge">Updated</span></span>'
        : 'Abstract navigation',
      text: isAstrophysics
        ? 'Like on ADS find more information about the record, including citations, references, or related records, view graphics and usage metrics, or export the bibliographic data in a variety of formats. SciX also goes beyond reference lists to reveal scientific contributions of data, software, and support as credits and mentions.'
        : 'Find more information about the record, including citations, references, or related records, view usage metrics, or export the bibliographic data in a variety of formats.',
      attachTo: {
        element: '[data-tour="abstract-nav-menu"]',
        on: isMobile ? 'bottom' : 'right',
      },
      classes: isAstrophysics ? 'tour-step-new' : '',
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
      title: isAstrophysics
        ? '<span class="tour-title">Authors list<span class="tour-badge">Updated</span></span>'
        : 'Authors list',
      text: isAstrophysics
        ? 'Click an author’s name or their ORCiD icon to search by their name or ORCiD. Click “show details” for a searchable panel of authors, ORCiD, and affiliations. '
        : 'Click an author’s name or their ORCiD icon to search by their name or ORCiD.',
      attachTo: {
        element: '[data-tour="authors-list"]',
        on: 'bottom',
      },
      classes: isAstrophysics ? 'tour-step-new' : '',
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
        return !!document.querySelector('[data-tour="authors-list"]');
      },
    },
    {
      id: 'document-type',
      title: isAstrophysics
        ? '<span class="tour-title">Document type<span class="tour-badge">✦ New Feature</span></span>'
        : 'Document type',
      text: 'The type of document is explicitly stated (<code>article</code>, <code>dataset</code>, <code>catalog</code>, <code>software</code>, <code>proposal</code>, <code>phdthesis</code>…) You can also filter for these using Publication Type or search for them using <code>doctype:</code>" ',
      attachTo: {
        element: '[data-tour="abs_doctype"]',
        on: 'bottom',
      },
      classes: isAstrophysics ? 'tour-step-new' : '',
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
        return isAstrophysics && !!document.querySelector('[data-tour="abs_doctype"]');
      },
    },
    {
      id: 'quick-citation-copy',
      title: isAstrophysics
        ? '<span class="tour-title">Quick citation copy<span class="tour-badge">✦ New Feature</span></span>'
        : 'Quick citation copy',
      text: isAstrophysics
        ? 'Copy the formatted citation, ready to paste into your text editor. Set your default format in your SciX account.'
        : 'Copy the formatted citation, ready to paste into your text editor.',
      attachTo: {
        element: '[data-tour="quick-citation-copy"]',
        on: 'bottom',
      },
      classes: isAstrophysics ? 'tour-step-new' : '',
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
        return !!document.querySelector('[data-tour="quick-citation-copy"]');
      },
    },
    {
      id: 'collections',
      title: isAstrophysics
        ? '<span class="tour-title">Collections<span class="tour-badge">✦ New Feature</span></span>'
        : 'Collections',
      text: 'Collections (<code>astronomy</code>, <code>earthscience</code>, <code>physics</code>, or <code>general</code>) to which the record belongs are explicitly stated; more than one is possible. You can filter for these using the Collections filter or search for them using <code>collection:</code>',
      attachTo: {
        element: '[data-tour="abs-collections"]',
        on: 'top',
      },
      classes: isAstrophysics ? 'tour-step-new' : '',
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
        return isAstrophysics && !!document.querySelector('[data-tour="abs-collections"]');
      },
    },
    {
      id: 'uat-keywords',
      title: '<span class="tour-title">UAT Keywords (generated)<span class="tour-badge">Beta</span></span>',
      text: 'SciX machine learning project to assign a consistent set of keywords to all astronomy records. Your feedback would be appreciated.',
      attachTo: {
        element: '[data-tour="abs-uat-keywords"]',
        on: 'top',
      },
      classes: 'tour-step-new',
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
        return isAstrophysics && !!document.querySelector('[data-tour="abs-uat-keywords"]');
      },
    },
    {
      id: 'add-to-library',
      title: isAstrophysics
        ? '<span class="tour-title">Add to library<span class="tour-badge-old">Same as ADS</span></span>'
        : 'Add to library',
      text: 'Add this record to one of your personal SciX libraries.',
      attachTo: {
        element: '[data-tour="add-to-library"]',
        on: 'bottom',
      },
      floatingUIOptions: {
        middleware: [offset(10)],
      },
      showOn() {
        return !!document.querySelector('[data-tour="add-to-library"]');
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
      title: isAstrophysics
        ? '<span class="tour-title">Get more by logging in<span class="tour-badge-old">Same as ADS</span></span>'
        : 'Get more by logging in',
      text: 'Set your institutional library, add records to your personal SciX libraries and share with colleagues, or set other customizations with a free SciX account.',
      attachTo: {
        element: isMobile ? '[data-tour="main-menu"]' : '[data-tour="account-menu"]',
        on: 'bottom',
      },
      floatingUIOptions: {
        middleware: [offset(10)],
      },
      showOn() {
        return !!document.querySelector(isMobile ? '[data-tour="main-menu"]' : '[data-tour="account-menu"]');
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
