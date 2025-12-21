# ecommerce

## How to Run the System

### Backend

```bash
cd backend
python backend.py
```
*Runs the backend server with Python.*

### Frontend

```bash
cd frontend
python -m http.server 8000
```
*Runs a simple HTTP server to serve frontend files on port 8000.*

---

## Git Workflow

1. **Create a Branch**

   Name your branch based on the type of change:
   - `feat/<short-description>` for new features
   - `fix/<short-description>` for bug fixes
   - `chore/<short-description>` for maintenance or chores

   Example:
   ```bash
   git checkout -b feat/user-auth
   ```

2. **Make Changes & Commit**

   ```bash
   git add .
   git commit -m "feat: add user authentication"
   ```

3. **Push Your Branch**

   ```bash
   git push origin feat/user-auth
   ```

4. **Pull Latest Changes Before Merging**

   Always update your branch:
   ```bash
   git pull origin main
   # resolve any conflicts and commit if necessary
   ```

5. **Create a Pull Request**

   Open a PR on GitHub to merge your branch into `main`.

---

Happy coding!
