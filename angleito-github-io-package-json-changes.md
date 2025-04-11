# Changes to make in package.json

Find the "build" script in package.json and change it from:

```json
"build": "contentlayer build && next build"
```

to:

```json
"build": "next build"
```

This will prevent contentlayer from running during the build process, which is causing the error.
