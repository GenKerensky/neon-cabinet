export interface PathCommand {
  type: string;
  params: number[];
}
export declare class PathTokenizer {
  /**
   * Tokenizes an SVG path string into a list of commands and their parameters.
   */
  static tokenize(d: string): PathCommand[];
}
