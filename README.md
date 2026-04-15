# SmartStudy

Two fully separate implementations of the same product, kept in one repo for easy comparison.

## Architecture folders

| Folder | Architecture | Backend shape |
|--------|----------------|---------------|
| `selected/` | Layered monolith | One backend app |
| `unselected/` | Microservices | Gateway + separate services |

No backend code is shared across these two folders.
