![build-test](https://github.com/ronazst/setup-sops/workflows/build-test/badge.svg)

## Setup CNCF SOPS
GitHub Action for installing [CNCF SOPS](https://github.com/getsops/sops)

#### Repurposed from [Azure/setup-helm](https://github.com/Azure/setup-helm)

Install a specific version of sops binary on the runner.
Acceptable values are latest or any semantic version string like v3.8.1 Use this action in workflow to define which version of sops will be used.

```yaml
- name: Setup CNCF SOPS
  uses: ronazst/setup-cncf-sops@v1
  with:
    version: '<version>' # optional, default is latest stable
```
