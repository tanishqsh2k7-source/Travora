# Travora — Rules for AI agents and contributors

## Language and style
- TypeScript strict mode everywhere. No `any` unless narrowed within 3 lines.
- ES modules only (`"type": "module"`). Use `.js` extensions in imports.
- Prefer `const` over `let`; never use `var`.
- Name files in kebab-case. Name types/interfaces in PascalCase.
- Exported functions: JSDoc summary. Non-obvious internal functions: at least
  a one-line comment.

## Schemas and types
- Zod is the single source of truth for all data shapes.
- Define schemas in `@travora/contracts`. Infer types with `z.infer<>`.
- Never duplicate a type that is already derivable from a Zod schema.

## Testing
- Every new module gets a `__tests__/` sibling with at least one happy-path
  and one error-path test.
- Tests run without network. Use fixture adapters and in-memory Mongo.
- Name test files `<module>.test.ts`.

## Money and math
- Represent money as `{ amount: number, currency: string }` with amount in
  smallest unit (cents).
- Use `decimal.js` for all money arithmetic.
- Budget, route, and scheduling logic goes in `engines/`, not in agent code.

## Git
- Commit messages follow Conventional Commits: `feat:`, `fix:`, `test:`,
  `chore:`, `docs:`.
- Never commit `.env`, `node_modules`, or `dist/`.

## Agents and LLM
- LLM calls go through LangGraph nodes, never called directly from route
  handlers.
- Keep agent state schemas in `@travora/contracts`.
- Deterministic steps (budget math, route ordering) are pure functions, not
  LLM calls.

## Providers
- Each external API has an interface in `providers/`.
- Always implement a fixture adapter alongside any live adapter.
- Select adapters via environment variables or dependency injection.

