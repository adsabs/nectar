import type { NextApiRequest, NextApiResponse } from 'next';
import planetaryData from '../../../../public/data/planetary/data.json';

type PlanetaryData = Array<{
  target: string;
  types: Array<{
    name: string;
    tagged: Array<{ name: string; bibcode: Array<string> }>;
  }>;
}>;

export type PlanetaryApiResponse = {
  bodies: Array<string>;
  types: Array<string>;
  features: Array<string>;
  bibcodes?: Array<string>;
};

export default function handler(req: NextApiRequest, res: NextApiResponse<PlanetaryApiResponse>) {
  if (req.method === 'GET') {
    const result: PlanetaryApiResponse = {
      bodies: [],
      types: [],
      features: [],
    };
    // if req has no params we return the list of bodies
    if (Object.keys(req.query).length === 0) {
      (planetaryData as PlanetaryData).forEach((item) => {
        result.bodies.push(item.target);
      });
    }

    // if req has a body param we return the list of types
    if (Object.keys(req.query).length === 1 && req.query.body) {
      const body = req.query.body as string;
      (planetaryData as PlanetaryData).forEach((item) => {
        if (item.target === body) {
          item.types.forEach((type) => {
            result.types.push(type.name);
          });
        }
      });
    }

    // if req has a body and type param we return the list of features
    if (Object.keys(req.query).length === 2 && req.query.body && req.query.type) {
      const body = req.query.body as string;
      const type = req.query.type as string;
      (planetaryData as PlanetaryData).forEach((item) => {
        if (item.target === body) {
          item.types.forEach((itemType) => {
            if (itemType.name === type) {
              itemType.tagged.forEach((tagged) => {
                result.features.push(tagged.name);
              });
            }
          });
        }
      });
    }

    res.status(200).json(result);
  }
  if (req.method === 'POST') {
    const { body, type, feature } = req.body as { body: string; type: string; feature: string };

    // get list of bibcodes for the selected feature
    const bibcodes: Array<string> = [];
    (planetaryData as PlanetaryData).forEach((item) => {
      if (item.target === body) {
        item.types.forEach((itemType) => {
          if (itemType.name === type) {
            itemType.tagged.forEach((tagged) => {
              if (tagged.name === feature) {
                bibcodes.push(...tagged.bibcode);
              }
            });
          }
        });
      }
    });

    return res.status(200).json({
      bodies: [],
      types: [],
      features: [],
      bibcodes,
    });
  }
}
