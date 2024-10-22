import { rest } from 'msw';

import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { IADSApiGraphicsParams } from '@/api/graphics/types';
import { ApiTargets } from '@/api/models';

export const graphicsHandlers = [
  rest.get<IADSApiGraphicsParams>(apiHandlerRoute(ApiTargets.GRAPHICS, ':id'), (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        bibcode: '2018A&A...616A...1G',
        number: 7,
        pick: '<a href="/graphics" border=0><img alt="alt" src="[\'https://s3.amazonaws.com/adsabs-thumbnails/seri/A%2BA/0616/aa33051-18/aa33051-18-fig2.jpg\', \'http://dx.doi.org/10.1051/0004-6361/201833051\']"></a>',
        figures: [
          {
            figure_label: 'Figure 1',
            figure_caption: '',
            figure_type: '',
            images: [
              {
                thumbnail: 'https://s3.amazonaws.com/adsabs-thumbnails/seri/A%2BA/0616/aa33051-18/aa33051-18-fig1.jpg',
                highres: 'http://dx.doi.org/10.1051/0004-6361/201833051',
              },
            ],
          },
          {
            figure_label: 'Figure 2',
            figure_caption: '',
            figure_type: '',
            images: [
              {
                thumbnail: 'https://s3.amazonaws.com/adsabs-thumbnails/seri/A%2BA/0616/aa33051-18/aa33051-18-fig2.jpg',
                highres: 'http://dx.doi.org/10.1051/0004-6361/201833051',
              },
            ],
          },
          {
            figure_label: 'Figure 3',
            figure_caption: '',
            figure_type: '',
            images: [
              {
                thumbnail: 'https://s3.amazonaws.com/adsabs-thumbnails/seri/A%2BA/0616/aa33051-18/aa33051-18-fig3.jpg',
                highres: 'http://dx.doi.org/10.1051/0004-6361/201833051',
              },
            ],
          },
          {
            figure_label: 'Figure 4',
            figure_caption: '',
            figure_type: '',
            images: [
              {
                thumbnail: 'https://s3.amazonaws.com/adsabs-thumbnails/seri/A%2BA/0616/aa33051-18/aa33051-18-fig4.jpg',
                highres: 'http://dx.doi.org/10.1051/0004-6361/201833051',
              },
            ],
          },
          {
            figure_label: 'Figure 5',
            figure_caption: '',
            figure_type: '',
            images: [
              {
                thumbnail: 'https://s3.amazonaws.com/adsabs-thumbnails/seri/A%2BA/0616/aa33051-18/aa33051-18-fig5.jpg',
                highres: 'http://dx.doi.org/10.1051/0004-6361/201833051',
              },
            ],
          },
          {
            figure_label: 'Figure 6',
            figure_caption: '',
            figure_type: '',
            images: [
              {
                thumbnail: 'https://s3.amazonaws.com/adsabs-thumbnails/seri/A%2BA/0616/aa33051-18/aa33051-18-fig6.jpg',
                highres: 'http://dx.doi.org/10.1051/0004-6361/201833051',
              },
            ],
          },
          {
            figure_label: 'Figure 7',
            figure_caption: '',
            figure_type: '',
            images: [
              {
                thumbnail: 'https://s3.amazonaws.com/adsabs-thumbnails/seri/A%2BA/0616/aa33051-18/aa33051-18-fig7.jpg',
                highres: 'http://dx.doi.org/10.1051/0004-6361/201833051',
              },
            ],
          },
        ],
        header:
          'Every image links to the article on <a href="http://www.aanda.org/" target="_new">Astronomy &amp; Astrophysics</a>',
      }),
    );
  }),
];
