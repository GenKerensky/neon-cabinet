export interface PathCommand {
  type: string;
  params: number[];
}

export class PathTokenizer {
  /**
   * Tokenizes an SVG path string into a list of commands and their parameters.
   */
  public static tokenize(d: string): PathCommand[] {
    const commands: PathCommand[] = [];
    // This regex finds a command letter followed by any number of coordinates (including negatives and decimals)
    const commandRegex = /([a-df-z])\s*([^a-df-z]*)/gi;
    const numberRegex = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;

    let match;

    while ((match = commandRegex.exec(d)) !== null) {
      const type = match[1];
      const paramsText = match[2];
      const params: number[] = [];

      let numMatch;
      while ((numMatch = numberRegex.exec(paramsText)) !== null) {
        params.push(parseFloat(numMatch[0]));
      }

      commands.push({ type, params });
    }

    return commands;
  }
}
