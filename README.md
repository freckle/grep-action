# Grep Action

Run `grep` and report results, along with additional context, as annotations.

## Motivation

This is a shameless copy of Code Climate's [`grep` engine][grep-engine]
([license][grep-license]), implementing the same functionality as a GitHub
Action.

[grep-engine]: https://docs.codeclimate.com/docs/grep
[grep-license]: https://github.com/codeclimate/codeclimate-grep/blob/master/LICENSE

The `grep` engine is a low-friction way to introduce automated, timely, and
_useful_ feedback on any piece of incoming code you can target with a regular
expression.

We wanted it as a GitHub Action to gain:

- Performance of running over only the changed files in the PR
- Convenience of annotations appearing in the diff (without a Browser Extension)

Note that if you're considering using this Action over Code Climate, you will
lose:

- Markdown support in the annotation content (until GitHub implements it)
- Tracking extant Issues over time and centralizing them with other Code Climate
  analyses

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

              paths-ignore:
                - "test/**/*"

              title: A brief title

              message: |
               A longer message body
```

## Inputs

- `patterns`: A string of yaml, representing a list of patterns (see above).

- `only-changed`: If `true` (the default), only the files changed in the Pull
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
