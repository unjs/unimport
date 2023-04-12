This folder contains the fixtures for the test cases.

The runner is defined in [`../cases.test.ts`](../cases.test.ts), that will pick up all the files in this folder and run them.

- `./negative` for cases that are expected to **not be injected**.
- `./positive` for cases that are expected to be injected by unimport. The output snapshot will be stored with `.output.` suffix in the same folder.
