const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const babel = require("@babel/core");

let ID = 0;

function getModuleInfo(filePath) {
    // read the file
    const content = fs.readFileSync(filePath, "utf-8");

    // create abstract syntax tree
    const ast = parser.parse(content, {
        sourceType: "module"
    });

    // dependencies in the module
    const deps = [];

    // traverse through the ast
    traverse(ast, {
        ImportDeclaration: ({ node }) => {
            deps.push(node.source.value);
        }
    });

    const { code } = babel.transformFromAstSync(ast, null);
    const id = ID++;

    return {
        id,
        filePath,
        deps,
        code
    };
}

let testEntry = getModuleInfo('./test-project/index.js');

console.log('testEntry', testEntry);