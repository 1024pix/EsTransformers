/**
 * Transform
 *
 *   const Lib = require('lib');
 *
 * to
 *
 *   import Lib from 'lib';
 *
 * ⚠ Only on global context
 */


import Logger from "./utils/logger";
import searchNodes from "./utils/search";
function transformer(file, api, options) {
    const j = api.jscodeshift;
    const logger = new Logger(file, options);

    /**
     * Search function
     */

    const nodes = searchNodes(j, file.source);

    logger.log(`${nodes.length} nodes will be transformed`);

    /**
     * Replace function
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
                const isRequireWithProp = isRequire && declaration.init.property !== undefined;
                if (isRequireWithProp) {
                    if (declaration.id.type === "Identifier") {
                        // default import
                        const sourcePath = declaration.init.arguments.shift();
                        if (declaration.init.arguments.length) {
                            logger.error(
                                `${logger.lines(declaration)} too many arguments.` + "Aborting transformation"
                            );
                            return file.source;
                        }
                        if (!j.Literal.check(sourcePath)) {
                            logger.error(
                                `${logger.lines(declaration)} bad argument.` +
                                    "Expecting a string literal, got " +
                                    j(sourcePath).toSource() +
                                    "`. Aborting transformation"
                            );
                            return file.source;
                        }
                        if (declaration?.init?.property.type === "Identifier") {
                            logger.log("Unknown declaration", declaration);
                        }
                        const specify = j.importSpecifier(declaration.init.property, declaration?.init?.property);
                        imports.push(j.importDeclaration([specify], sourcePath));
                    } else if (declaration.id.type === "ObjectPattern") {
                        // named import
                        // const { c } = require("mod").a
                        logger.log("Does not support pattern", declaration);
                    }
                } else if (isRequire) {
                    if (declaration.id.type === "Identifier") {
                        // default import
                        const importSpecifier = j.importDefaultSpecifier(declaration.id);
                        const sourcePath = declaration.init.arguments.shift();
                        if (declaration.init.arguments.length) {
                            logger.error(
                                `${logger.lines(declaration)} too many arguments.` + "Aborting transformation"
                            );
                            return file.source;
                        }
                        if (!j.Literal.check(sourcePath)) {
                            logger.error(
                                `${logger.lines(declaration)} bad argument.` +
                                    "Expecting a string literal, got " +
                                    j(sourcePath).toSource() +
                                    "`. Aborting transformation"
                            );
                            return file.source;
                        }
                        imports.push(j.importDeclaration([importSpecifier], sourcePath));
                    } else if (declaration.id.type === "ObjectPattern") {
                        /**
                         * named import
                         * const { specifierA, specifierB } = require("mod")
                         * ObjectPattern
                         * 
                         */

                        const specifiers = declaration.id.properties.map((property) => {
                            const key = j.identifier(property.key.name);
                            const value = j.identifier(property.value.name);
                            return j.importSpecifier(key, value);
                        });
                        const sourcePath = declaration.init.arguments.shift();
                        if (declaration.init.arguments.length) {
                            logger.error(
                                `${logger.lines(declaration)} too many arguments.` + "Aborting transformation"
                            );
                            return file.source;
                        }
                        if (!j.Literal.check(sourcePath)) {
                            logger.error(
                                `${logger.lines(declaration)} bad argument.` +
                                    "Expecting a string literal, got " +
                                    j(sourcePath).toSource() +
                                    "`. Aborting transformation"
                            );
                            return file.source;
                        }
                        imports.push(j.importDeclaration(specifiers, sourcePath));
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

export default transformer;