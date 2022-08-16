// extend the d3 Path element to cache the last angle
// Used for transitioning for animated transition to new angle
export interface ADSSVGPathElement extends SVGPathElement {
  lastAngle: { x0: number; x1: number };
}
