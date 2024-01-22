/**
 * Transforme
 *
 *   const Lib = require('lib');
 *
 * en
 *
 *   import Lib from 'lib';
 *
 * ⚠ Uniquement dans le contexte global
 */

import Logger from "./utils/logger";
import searchNodes from "./utils/search";

/**
 * Transforme les déclarations 'require' en déclarations 'import default'.
 *
 * @param {object} file - L'objet AST représentant le fichier source.
 * @param {object} api - L'API jscodeshift.
 * @param {object} options - Options de transformation.
 * @returns {string} - Le code source modifié.
 */
function requireToImportDefault(file, api, options) {
    const j = api.jscodeshift;
    const logger = new Logger(file, options);

    /**
     * Fonction de recherche des noeuds 'require'.
     */
    const nodes = searchNodes(j, file.source);

    logger.log(`${nodes.length} nodes will be transformed`);

    /**
     * Fonction de remplacement.
     */
    return nodes
        .replaceWith((path) => {
            const rest = [];
            const imports = [];

            for (const declaration of path.node.declarations) {
                const isRequire =
                    declaration.init !== null &&
                    declaration.init.type === "CallExpression" &&
                    declaration.init.callee.name === "require";

                if (isRequire) {
                    if (declaration.id.type === "Identifier") {
                        // Import par défaut
                        const importSpecifier = j.importDefaultSpecifier(declaration.id);
                        const sourcePath = declaration.init.arguments.shift();

                        if (!j.Literal.check(sourcePath)) {
                            logger.error(
                                `${logger.lines(declaration)} bad argument.` +
                                    ` Expecting a string literal, got ${j(sourcePath).toSource()}` +
                                    " Aborting transformation"
                            );
                            return file.source;
                        }

                        imports.push(j.importDeclaration([importSpecifier], sourcePath));
                    } else if (declaration.id.type === "ObjectPattern") {
                        // Import nommé (non supporté)
                        logger.log("Does not support pattern", declaration);
                    }
                } else {
                    rest.push(declaration);
                }
            }

            if (imports.length > 0) {
                imports[0].comments = path.node.comments;
            }

            if (rest.length > 0) {
                logger.warn(`${logger.lines(path.node)} introduced leftover`);
                return [...imports, j.variableDeclaration(path.node.kind, rest)];
            }

            return imports;
        })
        .toSource();
}

export default requireToImportDefault;
