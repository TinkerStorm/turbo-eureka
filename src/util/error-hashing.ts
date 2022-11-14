// #region Imports

// Node
import { createHash } from 'node:crypto';

// Packages
import { BaseInteractionContext } from 'slash-create';

// #endregion

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
    const hash = createHash('sha256');
    hash.update(targetID);
    hash.update(error.stack);
    return `${targetID}-${hash.digest('hex')}`;
  }

  addError(ctx: BaseInteractionContext, error: Error): [string, ErrorContext] {
    const hash = this.#generateHash(ctx.channelID, error);

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

    this.addErrorCount(ctx.channelID);

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
      const count = this.#errorCount.get(context.origin.channel) ?? 1;

      this.#errorCount.set(context.origin.channel, count - 1);
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

    const entry = this.#errorCount.get(targetID);
    return entry && entry >= 5;
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
