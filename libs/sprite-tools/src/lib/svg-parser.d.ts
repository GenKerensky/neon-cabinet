import { SVGPuppetMetadata } from "./types.js";
export declare class SVGParser {
  private parser;
  private static readonly DEFAULT_DIRECTION_ROTATION;
  constructor();
  parse(svgString: string): SVGPuppetMetadata;
  private parseViewBox;
  private parseElement;
  private parseAnimations;
  private parseDirectionBend;
  private parseDirectionRotation;
  private parseMaterial;
  private parsePhysics;
  private parseAudio;
  private parseNumericAttribute;
  private parseSocket;
  private parsePoints;
  private parseDataParams;
}
