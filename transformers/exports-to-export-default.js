/**
 * Transforme
 *
 *   module.exports = *;
 *
 * en
 *
 *   export default *;
 *
 * ⚠ Uniquement dans le contexte global
 */

import Logger from "./utils/logger";
import searchNodes from "./utils/search";

/**
 * Transforme la déclaration 'module.exports' en déclaration 'export default'.
 *
 * @param {object} file - L'objet AST représentant le fichier source.
 * @param {object} api - L'API jscodeshift.
 * @param {object} options - Options de transformation.
 * @returns {string} - Le code source modifié.
 */
function exportToExportDefault(file, api, options) {
    const j = api.jscodeshift;
    const logger = new Logger(file, options);

    /**
     * Fonction de recherche des noeuds 'module.exports'.
     */
    const nodes = searchNodes(j, file.source);

    if (nodes.length > 1) {
        logger.error(
            "Il ne devrait pas y avoir plus d'une déclaration `module.exports` dans un fichier. Transformation annulée."
        );
        return file.source;
    }

    logger.log(`${nodes.length} nodes will be transformed`);

    /**
     * Fonction de remplacement.
     */
    return nodes
        .replaceWith((path) => {
            const newNode = j.exportDefaultDeclaration(path.node.expression.right);
            newNode.comments = path.node.comments;
            return newNode;
        })
        .toSource();
}

export default exportToExportDefault;
