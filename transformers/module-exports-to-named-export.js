/**
 * Transforme
 *
 *   module.exports.a = *;
 *
 * en
 *
 *   export const a = *;
 *
 * Uniquement dans le contexte global
 */

import Logger from "./utils/logger";
import { isTopNode } from "./utils/filters";

/**
 * Transforme les déclarations de module.exports et exports en export const dans le contexte global.
 *
 * @param {object} file - L'objet AST représentant le fichier source.
 * @param {object} api - L'API jscodeshift.
 * @param {object} options - Options de transformation.
 * @returns {string} - Le code source modifié.
 */
function moduleExportToNamedExport(file, api, options) {
    const j = api.jscodeshift;
    const _isTopNode = (path) => isTopNode(j, path);
    const logger = new Logger(file, options);

    const ast = j(file.source);

    // Recherche des déclarations module.exports
    const moduleExportNodes = ast
        .find(j.ExpressionStatement, {
            expression: {
                left: {
                    object: {
                        object: {
                            name: "module"
                        },
                        property: {
                            name: "exports"
                        }
                    },
                    operator: "."
                },
                operator: "="
            }
        })
        .filter(_isTopNode);

    // Recherche des déclarations exports
    const exportNodes = ast
        .find(j.ExpressionStatement, {
            expression: {
                left: {
                    object: {
                        name: "exports"
                    },
                    operator: "."
                },
                operator: "="
            }
        })
        .filter(_isTopNode);

    logger.log(`${moduleExportNodes.length + exportNodes.length} nodes will be transformed`);

    const replace = (path) => {
        const node = path.node;
        const id = node.expression.left.property;
        const init = node.expression.right;

        if (id.type === "Identifier" && init.type === "Identifier") {
            // export { a as b }
            const newNode = j.exportNamedDeclaration(null, [j.exportSpecifier(j.identifier(init.name), j.identifier(id.name))]);
            newNode.comments = node.comments;
            return newNode;
        }

        const declaration = j.variableDeclaration("const", [j.variableDeclarator(j.identifier(id.name), init)]);
        const newNode = j.exportNamedDeclaration(declaration);
        newNode.comments = node.comments;
        return newNode;
    };

    // Remplacement des déclarations exports par export const
    exportNodes.replaceWith(replace);
    // Remplacement des déclarations module.exports par export const
    moduleExportNodes.replaceWith(replace);

    return ast.toSource();
}

export default moduleExportToNamedExport;
