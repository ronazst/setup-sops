# Publishing the setup-sops

Consider `npm outdated` to check for newer dependencies.

## Build the Container

```bash
cd $HOME/setup-sops
```

```bash
docker build -t setup-sops:build .
```

## Run the Built Container

```bash
docker run -it --rm \
--volume $HOME/setup-sops:/usr/src/app \
setup-sops:build \
/bin/sh
```
## Create artifacts

```bash
npm install
```

```bash
npm run publish
```

## Publish the changes

Add and commit changes.
Push to remote.
Merge PR with changes into Master.

```
git tag v99
git push --tags
```

Create release on Release page.