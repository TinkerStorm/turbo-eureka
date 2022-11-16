// #region Imports

// Packages
import CatLoggr from 'cat-loggr/ts';

// #endregion

export default new CatLoggr().setLevel(process.env.COMMANDS_DEBUG === 'true' ? 'debug' : 'info');
