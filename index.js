import toImportDefault from "./transformers/require-to-import-default";

const transformScripts = (fileInfo, api, options) => {
    return [toImportDefault].reduce((input, script) => {
        return script(
            {
                source: input
            },
            api,
            options
        );
    }, fileInfo.source);
};

module.exports = transformScripts;