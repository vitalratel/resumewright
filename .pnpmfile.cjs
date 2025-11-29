function readPackage(pkg) {
  // Fix WXT workspace dependencies by replacing workspace:^ with latest
  if (pkg.name === 'wxt' || pkg.name?.startsWith('@wxt-dev/')) {
    if (pkg.dependencies) {
      for (const [dep, version] of Object.entries(pkg.dependencies)) {
        if (dep.startsWith('@wxt-dev/') && version === 'workspace:^') {
          pkg.dependencies[dep] = 'latest';
        }
      }
    }
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
