import { isTopNode } from "./filters";

const searchNodes = (j,fileSource) => {
    const _isTopNode = (path) => isTopNode(j, path);

    j(fileSource)
    .find(j.ExpressionStatement, {
        expression: {
            left: {
                object: {
                    name: "module"
                },
                property: {
                    name: "exports"
                }
            },
            operator: "="
        }
    })
    .filter(_isTopNode);
} 

export default searchNodes;