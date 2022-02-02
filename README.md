# Grep Action

An action to run `grep` and report results, along with additional context, as
annotations.

## Motivation

We've found that, by far, the most useful [Code Climate engine][engines] we run
is the [`grep` engine][grep-engine]. It allows you to target unsafe or undesired
patterns in your code base being introduced in a PR and alert the author.

[engines]: #
[grep-engine]: #

The most useful aspect is that you can attach details to be presented to said
author when the "Issue" is raised. It's a low-friction way to introduce
automated, timely, and useful feedback fully customized to your project's needs.

## Usage

```yaml
on:
  pull_request:

jobs:
  grep:
    runs-on: ubuntu-latest
    steps:
      - uses: freckle/grep-action
        with:
          patterns: |
            - pattern: "re"

              paths:
                - "**/*"

              title: A brief title

              message: |
               A longer message body
```

## Inputs

- `patterns`: A string of yaml, representing a list of patterns, see above.

- `only-changed`: It `true` (the default) only the files changed in the Pull
  Request will be considered.

  **NOTE**: This action doesn't really work on non-`pull_request` events.

- `github-token`: override the default `GITHUB_TOKEN`, if desired.

See [`./action.yml`](./action.yml) for complete details.

## Outputs

None.

## Example

![](./screenshot.png)

## TODO

- [ ] Lift the 50-annotations limit, by updating in batches
- [ ] Support for triggering `-E`, `-F`, `-G`, or `-P`-like behaviors

---

[LICENSE](./LICENSE)
