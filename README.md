# SmartStudy

Two fully separate implementations of the same product, kept in one repo for easy comparison.

## Architecture folders

| Folder | Architecture | Backend shape |
|--------|----------------|---------------|
| `selected/` | Layered monolith | One backend app |
| `unselected/` | Microservices | Gateway + separate services |

No backend code is shared across these two folders.

You can push the repo to GitHub anytime. The backend is ready to show as a scaffold; the full wireframe UI is the next step.

## Why this repo shape

- easy to explain in class
- obvious side-by-side architecture differences
- each version can run independently

## GitHub push

```bash
cd /Users/camtofani/SmartStudy
git init
git add -A
git commit -m "Initial SmartStudy scaffold: monolith and microservices"
git branch -M main
git remote add origin https://github.com/YOUR_ORG/YOUR_REPO.git
git push -u origin main
```
