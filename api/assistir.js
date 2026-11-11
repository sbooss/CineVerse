/* /api/assistir — SSR das paginas /assistir/:type/:idslug
   O rewrite /assistir/:type/:idslug -> /api/assistir?media=:type&idslug=:idslug */
const { assistirHandler } = require('../lib/api/assistir');

module.exports = assistirHandler;
