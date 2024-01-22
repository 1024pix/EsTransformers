import requireToImportDefault from "./transformers/require-to-import-default";
import exportToExportDefault from "./transformers/exports-to-export-default";
import moduleExportToNamedExport from "./transformers/module-exports-to-named-export";
const transformScripts = (fileInfo, api, options) => {
    return [requireToImportDefault,exportToExportDefault, moduleExportToNamedExport].reduce((input, script) => {
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