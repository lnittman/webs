declare module 'chalk' {
  export interface ChalkInstance {
    (text: string | number): string;
    bold: ChalkInstance;
    italic: ChalkInstance;
    underline: ChalkInstance;
    inverse: ChalkInstance;
    strikethrough: ChalkInstance;
    visible: ChalkInstance;
    reset: ChalkInstance;
    black: ChalkInstance;
    red: ChalkInstance;
    green: ChalkInstance;
    yellow: ChalkInstance;
    blue: ChalkInstance;
    magenta: ChalkInstance;
    cyan: ChalkInstance;
    white: ChalkInstance;
    gray: ChalkInstance;
    grey: ChalkInstance;
    dim: ChalkInstance;
    blackBright: ChalkInstance;
    redBright: ChalkInstance;
    greenBright: ChalkInstance;
    yellowBright: ChalkInstance;
    blueBright: ChalkInstance;
    magentaBright: ChalkInstance;
    cyanBright: ChalkInstance;
    whiteBright: ChalkInstance;
    bgBlack: ChalkInstance;
    bgRed: ChalkInstance;
    bgGreen: ChalkInstance;
    bgYellow: ChalkInstance;
    bgBlue: ChalkInstance;
    bgMagenta: ChalkInstance;
    bgCyan: ChalkInstance;
    bgWhite: ChalkInstance;
    bgBlackBright: ChalkInstance;
    bgRedBright: ChalkInstance;
    bgGreenBright: ChalkInstance;
    bgYellowBright: ChalkInstance;
    bgBlueBright: ChalkInstance;
    bgMagentaBright: ChalkInstance;
    bgCyanBright: ChalkInstance;
    bgWhiteBright: ChalkInstance;
  }

  const chalk: ChalkInstance & {
    supportsColor: boolean;
    Level: {
      None: 0;
      Basic: 1;
      Ansi256: 2;
      TrueColor: 3;
    };
  };

  export default chalk;
} 