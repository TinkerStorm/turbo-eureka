// #region Imports

// Packages
import { ComponentContext, ComponentType, EditMessageOptions, MessageOptions } from 'slash-create';

// #endregion

type PatternCallback = (ctx: ComponentContext) => Promise<MessageOptions | EditMessageOptions | void>;

interface PatternData {
  command: string;
  pattern: RegExp;
  logHook?: (ctx: ComponentContext) => Record<string, unknown>;
  method: PatternCallback;
  type?: ComponentType;
}

export class PatternComponent {
  static hasRegisteredListener = false;
  static registeredPatterns: PatternData[] = [];

  data: PatternData;

  constructor(command: string) {
    this.data = {
      command,
      pattern: new RegExp(`^${command}`),
      method: async (ctx) => {
        await ctx.acknowledge();
      }
    };
  }

  public withPattern(pattern: RegExp) {
    this.data.pattern = pattern;
    return this;
  }

  public withMethod(method: PatternCallback) {
    this.data.method = method;
    return this;
  }

  public withLogHook(logHook: (ctx: ComponentContext) => Record<string, unknown>) {
    this.data.logHook = logHook;
    return this;
  }

  public requireComponent(type: ComponentType) {
    this.data.type = type;
    return this;
  }

  public register() {
    PatternComponent.registeredPatterns.push(this.data);
  }
}
