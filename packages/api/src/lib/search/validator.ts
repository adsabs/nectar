// import Ajv, { JSONSchemaType } from 'ajv';
// import { IADSApiSearchParams } from './types';

// const searchParamsSchema: JSONSchemaType<IADSApiSearchParams> = {
//   type: 'object',
//   properties: {
//     q: {
//       type: 'string',
//     },
//     fl: { type: 'array', items: { type: 'string' }, nullable: true },
//     rows: { type: 'number', nullable: true },
//     sort: {
//       type: 'array',
//       items: {
//         type: 'array',
//         items: [
//           { type: 'string', nullable: false },
//           { type: 'string', nullable: false },
//         ],
//         minItems: 2,
//         additionalItems: false,
//       },
//       nullable: true,
//     },
//   },
//   required: ['q'],
//   additionalProperties: false,
// };

// const ajv = new Ajv();

// export const validate = ajv.compile<IADSApiSearchParams>(searchParamsSchema);
