const fs = require('fs');
const path = require('path');

const visited = new Set();
const allDeps = new Set();

function getDependencies(packageName, nodeModulesPath = './node_modules') {
    if (visited.has(packageName)) return;
    visited.add(packageName);

    const packagePath = path.join(nodeModulesPath, packageName, 'package.json');

    if (!fs.existsSync(packagePath)) {
        console.error(`Warning: ${packagePath} not found`);
        return;
    }

    try {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const deps = { ...pkg.dependencies, ...pkg.peerDependencies };

        Object.keys(deps || {}).forEach(dep => {
            allDeps.add(dep);
            getDependencies(dep, nodeModulesPath);
        });
    } catch (err) {
        console.error(`Error reading ${packagePath}:`, err.message);
    }
}

// Start with snarkjs
allDeps.add('snarkjs');
getDependencies('snarkjs');

// Output as array for Next.js config
const depsArray = Array.from(allDeps).sort().map(dep => `      './node_modules/${dep}/**',`);
console.log('All dependencies found:');
console.log(depsArray.join('\n'));
console.log(`\nTotal: ${allDeps.size} packages`);
