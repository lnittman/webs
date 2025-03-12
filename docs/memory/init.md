# Memory Bank for LLM-Driven Development

This memory bank is a structured way to track the development process of the web CLI tool. It helps maintain context across multiple sessions and serves as a record of decisions, progress, and challenges.

## Purpose

The memory bank serves several key purposes:

1. **Persistent Context**: Maintains a clear record of what has been done, what decisions were made, and why
2. **Progress Tracking**: Documents completed work and upcoming tasks
3. **Knowledge Transfer**: Enables different LLMs or developers to pick up where others left off
4. **Decision History**: Records rationales for technical choices and design decisions

## Structure

The memory bank is organized as follows:

- `init.md`: This file, which serves as documentation for how to use the memory bank
- `bank/`: Directory containing numbered entry files
  - `00001.md`, `00002.md`, etc.: Individual memory entries in chronological order

## Entry Format

Each memory bank entry should follow this template:

```markdown
# Memory Entry {NUMBER}

## Date
YYYY-MM-DD

## Current State
Brief description of the current state of the project.

## Progress Made
- List of accomplishments since the last entry
- Code changes, features implemented
- Problems resolved

## Decisions
- Important decisions made
- Rationale behind technical choices
- Alternatives considered and why they were rejected

## Challenges
- Current roadblocks or issues
- Attempted solutions that didn't work
- Areas of uncertainty

## Next Steps
- Immediate next actions
- Upcoming priorities
- Open questions to address

## References
- Links to relevant documentation
- Citations for external code or solutions utilized
```

## Usage Guidelines

1. **Create New Entries**: Create a new numbered entry after significant progress or a development session
2. **Be Specific**: Include specific details about code changes, error messages, and solutions
3. **Link to Previous Entries**: Reference previous entries when building on earlier decisions
4. **Document Alternatives**: Note alternative approaches that were considered
5. **Track Next Steps**: Always end with clear, actionable next steps
6. **Review Past Entries**: Before starting new work, review recent entries to maintain context

## Best Practices

- Keep entries focused and concise
- Use code blocks for error messages and code snippets
- Avoid vague descriptions; provide concrete details
- Document all non-obvious decisions with clear rationale
- Maintain chronological order of entries
- Record challenges even if they haven't been resolved 