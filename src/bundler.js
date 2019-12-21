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

    const { code } = babel.transformFromAstSync(ast, null, {
        presets: ['@babel/preset-env']
    });
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
            //TODO: remove + `.js`
            const absolutePath = path.join(dirName, relPath) + '.js';
            const childModule = getModuleInfo(absolutePath);
            asset.mapping[relPath] = childModule.id;
            queue.push(childModule)
        })
    }
    return queue;
}

function bundle(graph) {
    let modules = '';

    graph.forEach(mod => {
        modules += `${mod.id}:[
            function( require, module, exports ){
                ${mod.code}
            },
            ${JSON.stringify(mod.mapping)}
        ],`
    })

    const result = `
    (function(modules){
        function require(id){
            const [fn, mapping] = modules[id];
            function localRequire(relativePath){
                return require(mapping[relativePath])
            }
            const module = {exports:{}};
            fn(localRequire, module, module.exports);
            return module.exports;
        }
        require(0);
    })({${modules}})`;

    return result;
}

let graph = createDependencyGraph('test-project/index.js');
let bundleCode = bundle(graph);

console.log('bundleCode', bundleCode);