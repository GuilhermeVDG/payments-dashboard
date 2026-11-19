---
name: ship-check
description: Final check before calling a step done or committing. Runs tests, type check, lint and build, asks the code-reviewer subagent for a review, and walks the spec acceptance list. Use at the end of every implementation step.
---

# Ship check

Run in order and stop at the first failure:

1. `npm test`
2. `npx tsc --noEmit`
3. `npm run lint`
4. `npm run build`
5. Delegate to the `code-reviewer` subagent: "Review the current diff against docs/spec.md and docs/review-checklist.md."
6. Open `docs/spec.md` section 9 and mark which acceptance items are covered, with the test name.

## Report format
```
Tests:      pass (N tests)
Types:      pass
Lint:       pass
Build:      pass
Review:     <blocking> blocking, <should-fix> should fix
Acceptance: <covered>/<total>
  [x] item  ->  tests/file.test.ts > test name
  [ ] item  ->  not covered yet
Next:       <what's left>
```

If anything is blocking, list it and propose the fix. Don't commit. Wait for the user.
