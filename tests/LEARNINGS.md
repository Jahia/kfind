# kfind e2e Test Infrastructure — Learnings

## JCR Node Constraints
- `kfindtest:mainResource` cannot be created under `jnt:contentFolder` — only under `jnt:page` (e.g. `/sites/${siteKey}/home`)
- `jnt:file` requires a `jcr:content` child (`jnt:resource`) with mandatory `jcr:mimeType` **and** `jcr:data` (binary)

## GraphQL File Upload
- `cy.request` with a `FormData` body silently serializes to `{}` — does NOT send multipart correctly
- Jahia's GraphQL binary upload: use form fields `query`, `variables`, and a named file field; set `variables.file = "<fieldname>"` (the field key), NOT null
- The graphql-multipart-spec (`map` + null variable) causes `j:extractedText = "org.apache...@xxx"` — the binary arrives as an object toString
- Working approach (mirrors what `@jahia/cypress` `uploadFile` does): `-F "query=..."  -F "variables=..." -F "filedata=<content>;type=text/plain"`

## Full-Text Search Behavior (nodesByCriteria `contains`)
- Hyphens in search term act as Lucene NOT operator — `"exact-TOKEN"` → `exact AND NOT TOKEN` → no match
- Word tokens from file content ARE indexed and searchable individually/by phrase
- File node names are NOT independently indexed for full-text search — only `j:extractedText` content counts
- To make `"exact-TOKEN"` searchable: put `"exact TOKEN"` (space-separated) as file content — but hyphenated query `"exact-TOKEN"` still won't match because of Lucene NOT

## Cypress cy.request
- Does NOT send `Origin` header by default — Jahia CSRF blocks requests without `Origin: http://localhost:8080`
- Must use `auth: {user, pass}` + explicit `Origin` header for all `/modules/graphql` calls
- `cy.apollo()` via `cross-fetch` also lacks `Origin` — use `cy.request` instead

## Site Setup
- `kfind-test-module` must be deployed as a `j:moduleType="templatesSet"` with a `<templates>` folder, a `<base>` template, a `<home>` page template, and a `<home>` page node
- `jnt:page` creation requires mandatory `j:templateName` property

## Test Status After This Session
| Spec | Result |
|---|---|
| kfindEdgeCases | ✅ 5/5 |
| kfindPages | ✅ 2/2 |
| kfindPagination | ✅ 2/2 |
| kfindMainResources | ✅ 3/3 |
| kfindMedia | ⚠️ 1/2 (filter test fails — hyphen in search term is Lucene NOT) |
| kfindFeatures | ⚠️ 1/2 |
| kfindInteraction | ⚠️ 1/3 |
