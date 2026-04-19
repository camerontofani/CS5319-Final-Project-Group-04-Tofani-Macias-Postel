# SmartStudy

Two fully separate implementations of the same product, kept in one repo for easy comparison.

## Architecture folders

| Folder | Architecture | Backend shape |
|--------|----------------|---------------|
| `selected/` | Microservices | Gateway + separate services |
| `unselected/` | Monolith | One backend app |

No backend code is shared across these two folders.
