# Site2 agent instructions

Inspect repository-local documentation, build configuration and tests first. Shared Vishar engineering baseline v0.1.0: https://github.com/vvetrov41-lgtm/Vishar-Engineering/blob/6a6e5a030c47f0691827bfd2a5865be497125a2c/README.md. Local rules and existing approvals take precedence; no automatic third-party code execution.

- Verify exact revision, expected and actual behavior; reproduce defects and add regression coverage when practical. Keep fixes bounded; use durable acceptance criteria for substantial changes.
- For website and booking changes, preserve design unless requested, verify mobile layout, keyboard accessibility, validation and integration compatibility. Use synthetic fixtures; never send real enquiries or client messages as incidental tests.
- Review security statically/read-only by default, including input validation, uploads, ownership, secrets and API routing. Do not expose private client data or bypass authorization.
- Prefer existing supported APIs over browser automation; use bounded structured contracts with authorization and explicit approval for writes.
- Run relevant exact-head checks and independent review; report skipped checks. Separate code, CI, merge and actual deployment verification. Follow existing deployment permissions.
- Record durable lessons in regression tests or decisions, not secrets or raw customer records.
