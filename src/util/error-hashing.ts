import crypto from 'crypto';

import { BaseInteractionContext } from 'slash-create';

interface ErrorContext {
  stack: string;
  message: string;
  timestamp: number;
  invocations?: {
    timestamp: number;
    user: string;
  }[];
  origin: {
    guild: string;
    channel: string;
    user: string;
  };
}

export class ErrorHashing {
  #hash = new Map<string, ErrorContext>();
  #errorCount = new Map<string, number>();

  #generateHash(targetID: string, error: Error) {
    // generate hash based on error
    const hash = crypto.createHash('sha256');
    hash.update(targetID);
    hash.update(error.stack);
    return `${targetID}-${hash.digest('hex')}`;
  }

  addError(ctx: BaseInteractionContext, error: Error): [string, ErrorContext] {
    const hash = this.#generateHash(ctx.guildID ? ctx.channelID : ctx.user.id, error);

    if (!this.#hash.has(hash)) {
      this.#hash.set(hash, {
        stack: error.stack,
        message: error.message,
        timestamp: ctx.invokedAt,
        invocations: [],
        origin: {
          guild: ctx.guildID ?? 'DM',
          channel: ctx.channelID,
          user: ctx.user.id
        }
      });
    }

    ctx.creator.emit('error', error);

    this.addErrorCount(ctx.guildID ? ctx.channelID : ctx.user.id);

    return [hash, this.#hash.get(hash)];
  }

  addErrorCount(targetID: string) {
    if (this.#errorCount.has(targetID)) {
      this.#errorCount.set(targetID, 0);
    }

    const count = this.#errorCount.get(targetID) ?? 0;
    this.#errorCount.set(targetID, count + 1);
    return count + 1;
  }

  getErrorCount(targetID: string) {
    return this.#errorCount.get(targetID) ?? 0;
  }

  removeError(hash: string) {
    const context = this.#hash.get(hash);
    if (context) {
      const count = this.#errorCount.get(context.origin.user) ?? 0;

      if (context.origin.guild)
        this.#errorCount.set(context.origin.channel, (this.#errorCount.get(context.origin.channel) ?? 0) - 1);
      this.#errorCount.set(context.origin.user, count - 1);

      this.#hash.delete(hash);

      return true;
    }

    return false;
  }

  clear() {
    this.#hash.clear();
    this.#errorCount.clear();
  }

  isLocked(ctx: BaseInteractionContext) {
    const targetID = ctx.guildID ? ctx.channelID : ctx.user.id;

    const entry = this.#errorCount.has(targetID);
    if (entry) {
      const count = this.#errorCount.get(targetID) ?? 0;
      if (count >= 5) {
        return true;
      }
    }
  }

  getAllErrorsBy(origin: string) {
    return [...this.#hash.entries()].filter(
      ([, value]) => value.origin.guild === origin || value.origin.user === origin
    );
  }

  getError(hash: string) {
    return this.#hash.get(hash);
  }
}

export default new ErrorHashing();
