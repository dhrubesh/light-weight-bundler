const fs = require("fs");
const parser = require("@babel/parser");
const path = require('path');
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

function createDependencyGraph(entryPoint) {
    let entryInfo = getModuleInfo(entryPoint);

    const queue = [entryInfo];

    
    for (const asset of queue) {
        const dirName = path.dirname(asset.filePath);
        asset.mapping = {};
        asset.deps.forEach(relPath => {
            // remove + .js
            const absolutePath = path.join(dirName, relPath) + '.js';
            const childModule = getModuleInfo(absolutePath);
            asset.mapping[relPath] = childModule.id;
            queue.push(childModule)
        })
    }
    return queue;
}

let graph = createDependencyGraph('test-project/index.js');
