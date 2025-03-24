import { forwardRef, Ref, SVGProps } from 'react';

const Logo = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    fillRule="evenodd"
    strokeLinejoin="round"
    strokeMiterlimit="2"
    clipRule="evenodd"
    viewBox="0 0 288 35"
    ref={ref}
    {...props}
  >
    <path
      fill="#FEFEFE"
      fillRule="nonzero"
      d="M278.672 27.956q-.777 0-1.183-.427-.407-.428-.407-1.202V10.158q0-.775.388-1.182.388-.408 1.125-.408.736 0 1.143.408.407.407.408 1.182v3.141h-.388q.62-2.287 2.365-3.528t4.303-1.318q.581-.039.932.252.347.29.388.988.037.66-.311 1.047-.35.389-1.085.465l-.621.077q-2.637.233-4.052 1.688-1.416 1.453-1.416 3.974v9.383q0 .775-.406 1.202-.408.427-1.183.427m-13.727.077q-2.985 0-5.137-1.182a8.25 8.25 0 0 1-3.334-3.354q-1.184-2.172-1.184-5.196 0-2.946 1.163-5.137 1.163-2.192 3.2-3.432 2.034-1.241 4.71-1.24 1.9 0 3.412.639a7.1 7.1 0 0 1 2.579 1.841q1.065 1.203 1.628 2.908.562 1.707.562 3.839.001.62-.349.911-.348.29-1.008.291h-13.493v-2.056h12.757l-.62.505q0-2.095-.621-3.548-.62-1.454-1.803-2.229-1.182-.774-2.967-.775-1.976 0-3.354.911-1.377.911-2.074 2.52-.697 1.61-.697 3.742v.232q0 3.568 1.725 5.428 1.725 1.861 4.904 1.861a10 10 0 0 0 2.618-.349 8.8 8.8 0 0 0 2.54-1.163q.542-.349.988-.329t.717.271.369.62q.095.369-.078.796-.174.425-.679.736-1.28.93-3.024 1.435a12.4 12.4 0 0 1-3.45.504m-20.548-.077q-.775 0-1.183-.427-.407-.428-.407-1.202V10.158q0-.775.388-1.182.388-.408 1.125-.408.736 0 1.143.408.408.407.408 1.182v3.141h-.388q.62-2.287 2.365-3.528t4.303-1.318q.583-.039.932.252.347.29.388.988.038.66-.311 1.047-.349.389-1.085.465l-.621.077q-2.637.233-4.052 1.688-1.416 1.453-1.416 3.974v9.383q0 .775-.406 1.202-.408.427-1.183.427m-15.317-2.443q1.745 0 3.063-.854 1.32-.852 2.037-2.48t.717-3.917q0-3.528-1.57-5.389-1.57-1.86-4.246-1.861-1.783 0-3.082.833-1.299.834-2.017 2.443t-.717 3.974q0 3.49 1.59 5.371 1.589 1.88 4.225 1.88m0 2.52q-2.753 0-4.769-1.202t-3.121-3.393-1.105-5.177q0-2.249.62-4.051t1.823-3.083a8.1 8.1 0 0 1 2.85-1.957q1.648-.679 3.702-.678 2.754 0 4.77 1.201t3.122 3.393q1.103 2.191 1.104 5.176 0 2.25-.62 4.033-.62 1.782-1.822 3.082a8 8 0 0 1-2.85 1.978q-1.649.679-3.704.678m-13.377 0q-2.79 0-4.265-1.706-1.473-1.706-1.474-4.886V1.668q0-.776.388-1.183t1.163-.407q.738 0 1.164.407t.426 1.183V21.21q0 2.094.834 3.12.833 1.029 2.463 1.028.348 0 .62-.039.27-.039.543-.039.426-.038.6.193.175.233.175.931t-.31 1.047q-.31.35-1.008.466-.31.04-.659.077a6 6 0 0 1-.66.039m-19.463-2.52q1.782 0 3.082-.854 1.299-.852 2.016-2.48t.718-3.917q0-3.528-1.57-5.389-1.57-1.86-4.245-1.861-1.746 0-3.063.833-1.32.834-2.035 2.443-.718 1.608-.718 3.974 0 3.49 1.59 5.371 1.588 1.88 4.225 1.88m-7.329 9.423q-.775 0-1.163-.407-.388-.408-.388-1.183V10.158q0-.775.388-1.182.388-.408 1.125-.408.774 0 1.183.408.407.407.407 1.182v3.685l-.427-.544q.62-2.21 2.462-3.509 1.843-1.297 4.4-1.297 2.52 0 4.401 1.182 1.88 1.183 2.908 3.374t1.027 5.214q0 2.985-1.027 5.177-1.027 2.19-2.889 3.393t-4.421 1.202q-2.558 0-4.381-1.299-1.823-1.297-2.481-3.471h.465v10.082q0 .774-.426 1.183-.426.405-1.163.406m-21.829-7.019a1.4 1.4 0 0 1-.893-.311 1.06 1.06 0 0 1-.406-.833q-.02-.525.484-1.105l6.785-8.53v1.629l-6.358-7.948q-.505-.621-.484-1.125.018-.503.406-.813a1.4 1.4 0 0 1 .893-.311q.582 0 .988.214.406.213.756.678l5.545 7.018h-1.087l5.584-7.018q.349-.466.737-.678.387-.214.97-.214.542 0 .911.311.368.31.388.833.019.522-.484 1.144l-6.321 7.832v-1.435l6.785 8.414q.467.582.447 1.105a1.07 1.07 0 0 1-.408.833 1.44 1.44 0 0 1-.93.311q-.543 0-.95-.214-.408-.212-.795-.678l-5.971-7.522h1.124l-5.972 7.522a2.7 2.7 0 0 1-.756.659q-.406.231-.988.232m-20.512-.232q-.852 0-1.299-.446-.445-.445-.445-1.299V2.094q0-.853.445-1.299.446-.446 1.299-.447h14.425q.659 0 1.008.35.348.349.349.969 0 .658-.349 1.008-.348.349-1.008.349h-13.067v9.46h12.253q.659 0 1.008.33.35.33.349.989.001.659-.349 1.008-.348.349-1.008.349h-12.253v9.848h13.067q.659 0 1.008.35.348.349.349.969 0 .658-.349 1.009-.348.348-1.008.349zm-26.086.348q-2.985 0-5.137-1.182a8.25 8.25 0 0 1-3.334-3.354q-1.183-2.172-1.184-5.196 0-2.946 1.163-5.137 1.163-2.192 3.2-3.432 2.034-1.241 4.71-1.24 1.9 0 3.412.639a7.1 7.1 0 0 1 2.579 1.841q1.065 1.203 1.629 2.908.562 1.707.562 3.839 0 .62-.35.911-.348.29-1.008.291h-13.493v-2.056h12.757l-.62.505q0-2.095-.621-3.548-.62-1.454-1.803-2.229-1.182-.774-2.967-.775-1.976 0-3.354.911-1.377.911-2.074 2.52-.697 1.61-.697 3.742v.232q-.001 3.568 1.726 5.428 1.724 1.861 4.903 1.861a10 10 0 0 0 2.618-.349 8.8 8.8 0 0 0 2.54-1.163q.542-.349.988-.329t.718.271.368.62q.095.369-.078.796-.174.425-.679.736-1.28.93-3.024 1.435a12.4 12.4 0 0 1-3.45.504m-18.068 0q-2.83 0-4.885-1.241-2.056-1.24-3.16-3.47t-1.105-5.177q0-2.248.621-4.032.62-1.783 1.822-3.043a7.9 7.9 0 0 1 2.889-1.919q1.685-.658 3.818-.658 1.396 0 2.908.425a7.3 7.3 0 0 1 2.754 1.474q.386.271.503.66.117.388 0 .755a1.4 1.4 0 0 1-.388.621 1.12 1.12 0 0 1-.678.291q-.408.04-.834-.271-1.009-.776-2.055-1.086a7 7 0 0 0-2.017-.31q-1.513 0-2.638.484a5.2 5.2 0 0 0-1.898 1.376q-.776.893-1.184 2.21-.406 1.32-.406 3.063 0 3.373 1.59 5.331t4.536 1.958q.97 0 1.996-.31 1.029-.309 2.075-1.086.427-.31.813-.271.389.039.659.292.272.251.369.639a1.4 1.4 0 0 1-.02.757q-.115.368-.504.64a7.9 7.9 0 0 1-2.714 1.453 9.9 9.9 0 0 1-2.867.445m-28.459-.077q-.775 0-1.163-.427-.388-.428-.388-1.202V10.158q0-.775.388-1.182.388-.408 1.125-.408.736 0 1.143.408.408.407.408 1.182v3.334l-.427-.464q.813-2.25 2.656-3.394 1.843-1.143 4.246-1.143 2.25 0 3.742.813 1.493.815 2.229 2.463t.736 4.167v10.392q0 .775-.406 1.202t-1.145.427q-.776 0-1.182-.427-.408-.428-.408-1.202V16.13q0-2.637-1.027-3.858-1.029-1.221-3.276-1.221-2.598 0-4.13 1.609-1.531 1.61-1.531 4.284v9.383q0 1.629-1.59 1.629m-13.687.077q-2.985 0-5.137-1.182a8.25 8.25 0 0 1-3.334-3.354q-1.182-2.172-1.183-5.196 0-2.946 1.163-5.137 1.163-2.192 3.199-3.432 2.035-1.241 4.71-1.24 1.9 0 3.412.639a7.1 7.1 0 0 1 2.579 1.841q1.065 1.203 1.628 2.908.562 1.707.562 3.839 0 .62-.349.911-.349.29-1.008.291H53.019v-2.056h12.757l-.62.505q0-2.095-.621-3.548-.621-1.454-1.803-2.229-1.182-.774-2.966-.775-1.977 0-3.354.911-1.376.91-2.074 2.52t-.698 3.742v.232q0 3.568 1.726 5.428 1.725 1.861 4.904 1.861a10 10 0 0 0 2.618-.349A8.8 8.8 0 0 0 65.428 24q.543-.349.988-.329.446.02.717.271.271.252.369.62.095.369-.078.796-.174.425-.679.736-1.28.93-3.024 1.435a12.4 12.4 0 0 1-3.451.504m-15.936-.155q-.775 0-1.163-.445-.388-.447-.388-1.26V10.314q0-.815.388-1.24.388-.427 1.163-.426.737 0 1.164.426.425.426.425 1.24v15.859q0 .813-.406 1.26-.408.445-1.183.445m-11.516.155q-2.83 0-4.885-1.241-2.056-1.24-3.16-3.47t-1.105-5.177q0-2.248.621-4.032.62-1.783 1.823-3.043A7.9 7.9 0 0 1 29 9.151q1.687-.658 3.819-.658 1.395 0 2.908.425a7.3 7.3 0 0 1 2.753 1.474q.387.271.503.66.117.388 0 .755a1.4 1.4 0 0 1-.387.621q-.27.252-.679.291-.407.04-.833-.271-1.008-.776-2.055-1.086a7 7 0 0 0-2.017-.31q-1.511 0-2.637.484a5.2 5.2 0 0 0-1.899 1.376q-.776.893-1.183 2.21-.407 1.32-.407 3.063 0 3.373 1.589 5.331 1.59 1.959 4.536 1.958.97 0 1.997-.31 1.029-.309 2.075-1.086.426-.31.814-.271t.659.292q.272.251.369.639a1.37 1.37 0 0 1-.02.757q-.116.368-.503.64a7.9 7.9 0 0 1-2.714 1.453 10 10 0 0 1-2.87.445m-22.566 0q-1.822 0-3.567-.31a17 17 0 0 1-3.238-.893 11.5 11.5 0 0 1-2.695-1.473q-.465-.35-.64-.796a1.5 1.5 0 0 1-.078-.891q.097-.447.389-.757.291-.31.717-.349.426-.04.931.271a12 12 0 0 0 3.722 1.804q1.978.562 4.459.562 3.49 0 5.176-1.298 1.687-1.3 1.687-3.433 0-1.745-1.221-2.732-1.221-.989-4.091-1.57l-4.033-.814q-3.645-.776-5.448-2.54Q.52 11.05.52 8.103q0-1.821.736-3.314A7.55 7.55 0 0 1 3.31 2.23Q4.628 1.163 6.452.582 8.275 0 10.484 0q2.442 0 4.556.679a12 12 0 0 1 3.819 2.036q.428.349.582.794.156.446.039.854a1.44 1.44 0 0 1-.407.678q-.29.27-.737.31-.444.04-.988-.31-1.551-1.163-3.218-1.687-1.667-.523-3.683-.523-2.057 0-3.548.62-1.493.62-2.326 1.803-.835 1.183-.834 2.734 0 1.861 1.144 2.946 1.144 1.087 3.742 1.59l4.032.853q3.916.814 5.797 2.462t1.88 4.479q0 1.706-.698 3.141a6.96 6.96 0 0 1-2.016 2.462q-1.319 1.029-3.179 1.57-1.863.543-4.189.542"
    ></path>
    <path
      fill="#0098DA"
      fillRule="nonzero"
      d="M44.353 4.347q-.969 0-1.512-.523-.543-.525-.543-1.416 0-.931.543-1.415.542-.484 1.512-.484 1.008 0 1.531.484.524.484.524 1.415 0 .891-.524 1.416-.523.522-1.531.523"
    ></path>
  </svg>
);

export const ScixText_H = forwardRef(Logo);
